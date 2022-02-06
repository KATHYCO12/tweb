/*
 * https://github.com/morethanwords/tweb
 * Copyright (C) 2019-2021 Eduard Kuzmenko
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

import type { AppMessagesManager } from "../../lib/appManagers/appMessagesManager";
import type { AppPeersManager } from "../../lib/appManagers/appPeersManager";
import type { AppPollsManager } from "../../lib/appManagers/appPollsManager";
import type { AppDocsManager, MyDocument } from "../../lib/appManagers/appDocsManager";
import type { AppMessagesIdsManager } from "../../lib/appManagers/appMessagesIdsManager";
import type { AppReactionsManager } from "../../lib/appManagers/appReactionsManager";
import type Chat from "./chat";
import { IS_TOUCH_SUPPORTED } from "../../environment/touchSupport";
import ButtonMenu, { ButtonMenuItemOptions } from "../buttonMenu";
import { attachContextMenuListener, MenuPositionPadding, openBtnMenu, positionMenu } from "../misc";
import PopupDeleteMessages from "../popups/deleteMessages";
import PopupForward from "../popups/forward";
import PopupPinMessage from "../popups/unpinMessage";
import { copyTextToClipboard } from "../../helpers/clipboard";
import PopupSendNow from "../popups/sendNow";
import { toast } from "../toast";
import I18n, { i18n, LangPackKey } from "../../lib/langPack";
import findUpClassName from "../../helpers/dom/findUpClassName";
import { cancelEvent } from "../../helpers/dom/cancelEvent";
import { attachClickEvent, simulateClickEvent } from "../../helpers/dom/clickEvent";
import isSelectionEmpty from "../../helpers/dom/isSelectionEmpty";
import { Message, Poll, Chat as MTChat, MessageMedia, AvailableReaction } from "../../layer";
import PopupReportMessages from "../popups/reportMessages";
import assumeType from "../../helpers/assumeType";
import PopupSponsored from "../popups/sponsored";
import Scrollable, { ScrollableBase, ScrollableX } from "../scrollable";
import { wrapSticker } from "../wrappers";
import RLottiePlayer from "../../lib/rlottie/rlottiePlayer";
import getVisibleRect from "../../helpers/dom/getVisibleRect";
import ListenerSetter from "../../helpers/listenerSetter";
import animationIntersector from "../animationIntersector";
import { getMiddleware } from "../../helpers/middleware";
import noop from "../../helpers/noop";
import callbackify from "../../helpers/callbackify";
import rootScope from "../../lib/rootScope";
import { fastRaf } from "../../helpers/schedulers";
import lottieLoader from "../../lib/rlottie/lottieLoader";
import PeerTitle from "../peerTitle";
import StackedAvatars from "../stackedAvatars";
import { IS_APPLE } from "../../environment/userAgent";

const REACTIONS_CLASS_NAME = 'btn-menu-reactions';
const REACTION_CLASS_NAME = REACTIONS_CLASS_NAME + '-reaction';

const REACTION_SIZE = 28;
const PADDING = 4;
const REACTION_CONTAINER_SIZE = REACTION_SIZE + PADDING * 2;

type ChatReactionsMenuPlayers = {
  select?: RLottiePlayer,
  appear?: RLottiePlayer,
  selectWrapper: HTMLElement,
  appearWrapper: HTMLElement,
  reaction: string
};
export class ChatReactionsMenu {
  public widthContainer: HTMLElement;
  private container: HTMLElement;
  private reactionsMap: Map<HTMLElement, ChatReactionsMenuPlayers>;
  private scrollable: ScrollableBase;
  private animationGroup: string;
  private middleware: ReturnType<typeof getMiddleware>;
  private message: Message.message;

  constructor(
    private appReactionsManager: AppReactionsManager,
    private type: 'horizontal' | 'vertical',
    middleware: ChatReactionsMenu['middleware']
  ) {
    const widthContainer = this.widthContainer = document.createElement('div');
    widthContainer.classList.add(REACTIONS_CLASS_NAME + '-container');
    widthContainer.classList.add(REACTIONS_CLASS_NAME + '-container-' + type);

    const reactionsContainer = this.container = document.createElement('div');
    reactionsContainer.classList.add(REACTIONS_CLASS_NAME);

    const reactionsScrollable = this.scrollable = type === 'vertical' ? new Scrollable(undefined) : new ScrollableX(undefined);
    reactionsContainer.append(reactionsScrollable.container);
    reactionsScrollable.onAdditionalScroll = this.onScroll;
    reactionsScrollable.setListeners();

    reactionsScrollable.container.classList.add('no-scrollbar');

    ['big'].forEach(type => {
      const bubble = document.createElement('div');
      bubble.classList.add(REACTIONS_CLASS_NAME + '-bubble', REACTIONS_CLASS_NAME + '-bubble-' + type);
      reactionsContainer.append(bubble);
    });

    this.reactionsMap = new Map();
    this.animationGroup = 'CHAT-MENU-REACTIONS-' + Date.now();
    animationIntersector.setOverrideIdleGroup(this.animationGroup, true);

    if(!IS_TOUCH_SUPPORTED) {
      reactionsContainer.addEventListener('mousemove', this.onMouseMove);
    }

    attachClickEvent(reactionsContainer, (e) => {
      const reactionDiv = findUpClassName(e.target, REACTION_CLASS_NAME);
      if(!reactionDiv) return;

      const players = this.reactionsMap.get(reactionDiv);
      if(!players) return;

      this.appReactionsManager.sendReaction(this.message, players.reaction);
    });

    widthContainer.append(reactionsContainer);

    this.middleware = middleware ?? getMiddleware();
  }

  public init(message: Message.message) {
    this.message = message;

    const middleware = this.middleware.get();
    // const result = Promise.resolve(this.appReactionsManager.getAvailableReactionsForPeer(message.peerId)).then((res) => pause(1000).then(() => res));
    const result = this.appReactionsManager.getAvailableReactionsByMessage(message);
    callbackify(result, (reactions) => {
      if(!middleware() || !reactions.length) return;
      reactions.forEach(reaction => {
        this.renderReaction(reaction);
      });

      const setVisible = () => {
        this.container.classList.add('is-visible');
      };

      if(result instanceof Promise) {
        fastRaf(setVisible);
      } else {
        setVisible();
      }
    });
  }

  public cleanup() {
    this.middleware.clean();
    this.scrollable.removeListeners();
    this.reactionsMap.clear();
    animationIntersector.setOverrideIdleGroup(this.animationGroup, false);
    animationIntersector.checkAnimations(true, this.animationGroup, true);
  }

  private onScroll = () => {
    this.reactionsMap.forEach((players, div) => {
      this.onScrollProcessItem(div, players);
    });
  };

  private renderReaction(reaction: AvailableReaction) {
    const reactionDiv = document.createElement('div');
    reactionDiv.classList.add(REACTION_CLASS_NAME);

    const scaleContainer = document.createElement('div');
    scaleContainer.classList.add(REACTION_CLASS_NAME + '-scale');

    const appearWrapper = document.createElement('div');
    let selectWrapper: HTMLElement;;
    appearWrapper.classList.add(REACTION_CLASS_NAME + '-appear');

    if(rootScope.settings.animationsEnabled) {
      selectWrapper = document.createElement('div');
      selectWrapper.classList.add(REACTION_CLASS_NAME + '-select', 'hide');
    }

    const players: ChatReactionsMenuPlayers = {
      selectWrapper,
      appearWrapper,
      reaction: reaction.reaction
    };
    this.reactionsMap.set(reactionDiv, players);

    const middleware = this.middleware.get();

    const hoverScale = IS_TOUCH_SUPPORTED ? 1 : 1.25;
    const size = REACTION_SIZE * hoverScale;

    const options = {
      width: size,
      height: size,
      skipRatio: 1,
      needFadeIn: false,
      withThumb: false,
      group: this.animationGroup,
      middleware
    };

    if(!rootScope.settings.animationsEnabled) {
      delete options.needFadeIn;
      delete options.withThumb;

      wrapSticker({
        doc: reaction.static_icon,
        div: appearWrapper,
        ...options
      });
    } else {
      let isFirst = true;
      wrapSticker({
        doc: reaction.appear_animation,
        div: appearWrapper,
        play: true,
        ...options
      }).then(player => {
        assumeType<RLottiePlayer>(player);
  
        players.appear = player;
  
        player.addEventListener('enterFrame', (frameNo) => {
          if(player.maxFrame === frameNo) {
            selectLoadPromise.then((selectPlayer) => {
              assumeType<RLottiePlayer>(selectPlayer);
              appearWrapper.classList.add('hide');
              selectWrapper.classList.remove('hide');
  
              if(isFirst) {
                players.select = selectPlayer;
                isFirst = false;
              }
            }, noop);
          }
        });
      }, noop);
  
      const selectLoadPromise = wrapSticker({
        doc: reaction.select_animation,
        div: selectWrapper,
        ...options
      }).then(player => {
        assumeType<RLottiePlayer>(player);

        return lottieLoader.waitForFirstFrame(player);
      }).catch(noop);
    }
    
    scaleContainer.append(appearWrapper);
    selectWrapper && scaleContainer.append(selectWrapper);
    reactionDiv.append(scaleContainer);
    this.scrollable.append(reactionDiv);
  }

  private onScrollProcessItem(div: HTMLElement, players: ChatReactionsMenuPlayers) {
    const scaleContainer = div.firstElementChild as HTMLElement;
    const visibleRect = getVisibleRect(div, this.scrollable.container);
    if(!visibleRect) {
      if(!players.appearWrapper.classList.contains('hide') || !players.appear) {
        return;
      }

      if(players.select) {
        players.select.stop();
      }

      players.appear.stop();
      players.appear.autoplay = true;
      players.appearWrapper.classList.remove('hide');
      players.selectWrapper.classList.add('hide');
      scaleContainer.style.transform = '';
    } else if(visibleRect.overflow.left || visibleRect.overflow.right) {
      const diff = Math.abs(visibleRect.rect.left - visibleRect.rect.right);
      const scale = Math.min(diff ** 2 / REACTION_CONTAINER_SIZE ** 2, 1);

      scaleContainer.style.transform = `scale(${scale})`;
    } else {
      scaleContainer.style.transform = '';
    }
  }

  private onMouseMove = (e: MouseEvent) => {
    const reactionDiv = findUpClassName(e.target, REACTION_CLASS_NAME);
    if(!reactionDiv) {
      return;
    }
    
    const players = this.reactionsMap.get(reactionDiv);
    if(!players) {
      return;
    }

    // do not play select animation when appearing
    if(!players.appear?.paused) {
      return;
    }

    const player = players.select;
    if(!player) {
      return;
    }

    if(player.paused) {
      player.autoplay = true;
      player.restart();
    }
  };
}

export default class ChatContextMenu {
  private buttons: (ButtonMenuItemOptions & {verify: () => boolean, notDirect?: () => boolean, withSelection?: true, isSponsored?: true})[];
  private element: HTMLElement;

  private isSelectable: boolean;
  private isSelected: boolean;
  private target: HTMLElement;
  private isTargetAGroupedItem: boolean;
  private isTextSelected: boolean;
  private isAnchorTarget: boolean;
  private isUsernameTarget: boolean;
  private isSponsored: boolean;
  private isOverBubble: boolean;
  private peerId: PeerId;
  private mid: number;
  private message: Message.message | Message.messageService;
  private noForwards: boolean;

  private reactionsMenu: ChatReactionsMenu;
  private listenerSetter: ListenerSetter;

  private viewerPeerId: PeerId;
  private middleware: ReturnType<typeof getMiddleware>;

  constructor(
    private attachTo: HTMLElement, 
    private chat: Chat, 
    private appMessagesManager: AppMessagesManager, 
    private appPeersManager: AppPeersManager, 
    private appPollsManager: AppPollsManager,
    private appDocsManager: AppDocsManager,
    private appMessagesIdsManager: AppMessagesIdsManager,
    private appReactionsManager: AppReactionsManager
  ) {
    this.listenerSetter = new ListenerSetter();
    this.middleware = getMiddleware();

    if(IS_TOUCH_SUPPORTED/*  && false */) {
      attachClickEvent(attachTo, (e) => {
        if(chat.selection.isSelecting) {
          return;
        }

        const className = (e.target as HTMLElement).className;
        if(!className || !className.includes) return;

        chat.log('touchend', e);

        const good = ['bubble', 'bubble-content-wrapper', 'bubble-content', 'message', 'time', 'inner'].find(c => className.match(new RegExp(c + '($|\\s)')));
        if(good) {
          cancelEvent(e);
          //onContextMenu((e as TouchEvent).changedTouches[0]);
          // onContextMenu((e as TouchEvent).changedTouches ? (e as TouchEvent).changedTouches[0] : e as MouseEvent);
          this.onContextMenu(e);
        }
      }, {listenerSetter: this.chat.bubbles.listenerSetter});
    } else attachContextMenuListener(attachTo, this.onContextMenu, this.chat.bubbles.listenerSetter);
  }

  private onContextMenu = (e: MouseEvent | Touch | TouchEvent) => {
    let bubble: HTMLElement, contentWrapper: HTMLElement;

    try {
      contentWrapper = findUpClassName(e.target, 'bubble-content-wrapper');
      bubble = contentWrapper ? contentWrapper.parentElement : findUpClassName(e.target, 'bubble');
    } catch(e) {}

    // ! context menu click by date bubble (there is no pointer-events)
    if(!bubble || bubble.classList.contains('bubble-first')) return;

    let element = this.element;
    if(e instanceof MouseEvent || e.hasOwnProperty('preventDefault')) (e as any).preventDefault();
    if(element && element.classList.contains('active')) {
      return false;
    }
    if(e instanceof MouseEvent || e.hasOwnProperty('cancelBubble')) (e as any).cancelBubble = true;

    let mid = +bubble.dataset.mid;
    if(!mid) return;

    const isSponsored = this.isSponsored = mid < 0;
    this.isSelectable = this.chat.selection.canSelectBubble(bubble);
    this.peerId = this.chat.peerId;
    //this.msgID = msgID;
    this.target = e.target as HTMLElement;
    this.isTextSelected = !isSelectionEmpty();
    this.isAnchorTarget = this.target.tagName === 'A' && (
      (this.target as HTMLAnchorElement).target === '_blank' || 
      this.target.classList.contains('anchor-url')
    );
    this.isUsernameTarget = this.target.tagName === 'A' && this.target.classList.contains('mention');

    // * если открыть контекстное меню для альбома не по бабблу, и последний элемент не выбран, чтобы показать остальные пункты
    if(this.chat.selection.isSelecting && !contentWrapper) {
      if(isSponsored) {
        return;
      }

      const mids = this.chat.getMidsByMid(mid);
      if(mids.length > 1) {
        const selectedMid = this.chat.selection.isMidSelected(this.peerId, mid) ? 
          mid : 
          mids.find(mid => this.chat.selection.isMidSelected(this.peerId, mid));
        if(selectedMid) {
          mid = selectedMid;
        }
      }
    }

    this.isOverBubble = !!contentWrapper;

    const groupedItem = findUpClassName(this.target, 'grouped-item');
    this.isTargetAGroupedItem = !!groupedItem;
    if(groupedItem) {
      this.mid = +groupedItem.dataset.mid;
    } else {
      this.mid = mid;
    }

    this.isSelected = this.chat.selection.isMidSelected(this.peerId, this.mid);
    this.message = this.chat.getMessage(this.mid);
    this.noForwards = !isSponsored && !this.appMessagesManager.canForward(this.message);
    this.viewerPeerId = undefined;

    const initResult = this.init();
    element = initResult.element;
    const {cleanup, destroy, menuPadding} = initResult;

    const side: 'left' | 'right' = bubble.classList.contains('is-in') ? 'left' : 'right';
    //bubble.parentElement.append(element);
    //appImManager.log('contextmenu', e, bubble, side);
    positionMenu((e as TouchEvent).touches ? (e as TouchEvent).touches[0] : e as MouseEvent, element, side, menuPadding);
    openBtnMenu(element, () => {
      this.mid = 0;
      this.peerId = undefined;
      this.target = null;
      this.viewerPeerId = undefined;
      cleanup();

      setTimeout(() => {
        destroy();
      }, 300);
    });
  };

  public cleanup() {
    this.listenerSetter.removeAll();
    this.reactionsMenu && this.reactionsMenu.cleanup();
    this.middleware.clean();
  }

  public destroy() {
    this.cleanup();
  }

  private filterButtons(buttons: ChatContextMenu['buttons']) {
    if(this.isSponsored) {
      return buttons.filter(button => {
        return button.isSponsored;
      });
    } else {
      return buttons.filter(button => {
        let good: boolean;

        //if((appImManager.chatSelection.isSelecting && !button.withSelection) || (button.withSelection && !appImManager.chatSelection.isSelecting)) {
        if(this.chat.selection.isSelecting && !button.withSelection) {
          good = false;
        } else {
          good = this.isOverBubble || IS_TOUCH_SUPPORTED || true ? 
            button.verify() : 
            button.notDirect && button.verify() && button.notDirect();
        }

        return good;
      });
    }
  }

  private setButtons() {
    this.buttons = [{
      icon: 'send2',
      text: 'MessageScheduleSend',
      onClick: this.onSendScheduledClick,
      verify: () => this.chat.type === 'scheduled' && !this.message.pFlags.is_outgoing
    }, {
      icon: 'send2',
      text: 'Message.Context.Selection.SendNow',
      onClick: this.onSendScheduledClick,
      verify: () => this.chat.type === 'scheduled' && this.isSelected && !this.chat.selection.selectionSendNowBtn.hasAttribute('disabled'),
      notDirect: () => true,
      withSelection: true
    }, {
      icon: 'schedule',
      text: 'MessageScheduleEditTime',
      onClick: () => {
        this.chat.input.scheduleSending(() => {
          assumeType<Message.message>(this.message);
          this.appMessagesManager.editMessage(this.message, this.message.message, {
            scheduleDate: this.chat.input.scheduleDate,
            entities: this.message.entities
          });

          this.chat.input.onMessageSent(false, false);
        }, new Date(this.message.date * 1000));
      },
      verify: () => this.chat.type === 'scheduled'
    }, {
      icon: 'reply',
      text: 'Reply',
      onClick: this.onReplyClick,
      verify: () => this.chat.canSend() && 
        !this.message.pFlags.is_outgoing && 
        !!this.chat.input.messageInput && 
        this.chat.type !== 'scheduled'/* ,
      cancelEvent: true */
    }, {
      icon: 'edit',
      text: 'Edit',
      onClick: this.onEditClick,
      verify: () => this.appMessagesManager.canEditMessage(this.message, 'text') && !!this.chat.input.messageInput
    }, {
      icon: 'copy',
      text: 'Copy',
      onClick: this.onCopyClick,
      verify: () => !this.noForwards && !!(this.message as Message.message).message && !this.isTextSelected && (!this.isAnchorTarget || (this.message as Message.message).message !== this.target.innerText)
    }, {
      icon: 'copy',
      text: 'Chat.CopySelectedText',
      onClick: this.onCopyClick,
      verify: () => !this.noForwards && !!(this.message as Message.message).message && this.isTextSelected
    }, {
      icon: 'copy',
      text: 'Message.Context.Selection.Copy',
      onClick: this.onCopyClick,
      verify: () => {
        if(!this.isSelected || this.noForwards) {
          return false;
        }

        for(const [peerId, mids] of this.chat.selection.selectedMids) {
          for(const mid of mids) {
            if(!!this.appMessagesManager.getMessageByPeer(peerId, mid).message) {
              return true;
            }
          }
        }

        return false;
      },
      notDirect: () => true,
      withSelection: true
    }, {
      icon: 'copy',
      text: 'CopyLink',
      onClick: this.onCopyAnchorLinkClick,
      verify: () => this.isAnchorTarget,
      withSelection: true
    }, {
      icon: 'copy',
      text: 'Text.Context.Copy.Username',
      onClick: () => {
        copyTextToClipboard(this.target.innerHTML);
      },
      verify: () => this.isUsernameTarget,
      withSelection: true
    }, {
      icon: 'copy',
      text: 'Text.Context.Copy.Hashtag',
      onClick: () => {
        copyTextToClipboard(this.target.innerHTML);
      },
      verify: () => this.target.classList.contains('anchor-hashtag'),
      withSelection: true
    }, {
      icon: 'link',
      text: 'MessageContext.CopyMessageLink1',
      onClick: this.onCopyLinkClick,
      verify: () => this.appPeersManager.isChannel(this.peerId) && !this.message.pFlags.is_outgoing
    }, {
      icon: 'pin',
      text: 'Message.Context.Pin',
      onClick: this.onPinClick,
      verify: () => !this.message.pFlags.is_outgoing && 
        this.message._ !== 'messageService' && 
        !this.message.pFlags.pinned && 
        this.appPeersManager.canPinMessage(this.peerId) && 
        this.chat.type !== 'scheduled',
    }, {
      icon: 'unpin',
      text: 'Message.Context.Unpin',
      onClick: this.onUnpinClick,
      verify: () => (this.message as Message.message).pFlags.pinned && this.appPeersManager.canPinMessage(this.peerId),
    }, {
      icon: 'download',
      text: 'MediaViewer.Context.Download',
      onClick: () => {
        this.appDocsManager.saveDocFile((this.message as any).media.document);
      },
      verify: () => {
        if(this.message.pFlags.is_outgoing) {
          return false;
        }
        
        const doc: MyDocument = ((this.message as Message.message).media as MessageMedia.messageMediaDocument)?.document as any;
        if(!doc) return false;
        
        let hasTarget = !!IS_TOUCH_SUPPORTED;
        const isGoodType = !doc.type || !(['gif', 'video', 'sticker'] as MyDocument['type'][]).includes(doc.type);
        if(isGoodType) hasTarget = hasTarget || !!findUpClassName(this.target, 'document') || !!findUpClassName(this.target, 'audio');
        return isGoodType && hasTarget;
      }
    }, {
      icon: 'checkretract',
      text: 'Chat.Poll.Unvote',
      onClick: this.onRetractVote,
      verify: () => {
        const poll = (this.message as any).media?.poll as Poll;
        return poll && poll.chosenIndexes.length && !poll.pFlags.closed && !poll.pFlags.quiz;
      }/* ,
      cancelEvent: true */
    }, {
      icon: 'stop',
      text: 'Chat.Poll.Stop',
      onClick: this.onStopPoll,
      verify: () => {
        const poll = (this.message as any).media?.poll;
        return this.appMessagesManager.canEditMessage(this.message, 'poll') && poll && !poll.pFlags.closed && !this.message.pFlags.is_outgoing;
      }/* ,
      cancelEvent: true */
    }, {
      icon: 'forward',
      text: 'Forward',
      onClick: this.onForwardClick, // let forward the message if it's outgoing but not ours (like a changelog)
      verify: () => !this.noForwards && this.chat.type !== 'scheduled' && (!this.message.pFlags.is_outgoing || !this.message.pFlags.out) && this.message._ !== 'messageService'
    }, {
      icon: 'forward',
      text: 'Message.Context.Selection.Forward',
      onClick: this.onForwardClick,
      verify: () => this.chat.selection.selectionForwardBtn && 
        this.isSelected && 
        !this.chat.selection.selectionForwardBtn.hasAttribute('disabled'),
      notDirect: () => true,
      withSelection: true
    }, {
      icon: 'flag',
      text: 'ReportChat',
      onClick: () => {
        new PopupReportMessages(this.peerId, [this.mid]);
      },
      verify: () => !this.message.pFlags.out && this.message._ === 'message' && !this.message.pFlags.is_outgoing && this.appPeersManager.isChannel(this.peerId),
      notDirect: () => true,
      withSelection: true
    }, {
      icon: 'select',
      text: 'Message.Context.Select',
      onClick: this.onSelectClick,
      verify: () => !(this.message as Message.messageService).action && !this.isSelected && this.isSelectable,
      notDirect: () => true,
      withSelection: true
    }, {
      icon: 'select',
      text: 'Message.Context.Selection.Clear',
      onClick: this.onClearSelectionClick,
      verify: () => this.isSelected,
      notDirect: () => true,
      withSelection: true
    }, {
      onClick: () => {
        if(this.viewerPeerId) {
          this.chat.appImManager.setInnerPeer({
            peerId: this.viewerPeerId
          });
        }
      },
      verify: () => !this.peerId.isUser() && (!!(this.message as Message.message).reactions?.recent_reactons?.length || this.appMessagesManager.canViewMessageReadParticipants(this.message)),
      notDirect: () => true
    }, {
      icon: 'delete danger',
      text: 'Delete',
      onClick: this.onDeleteClick,
      verify: () => this.appMessagesManager.canDeleteMessage(this.message)
    }, {
      icon: 'delete danger',
      text: 'Message.Context.Selection.Delete',
      onClick: this.onDeleteClick,
      verify: () => this.isSelected && !this.chat.selection.selectionDeleteBtn.hasAttribute('disabled'),
      notDirect: () => true,
      withSelection: true
    }, {
      icon: 'info',
      text: 'Chat.Message.Sponsored.What',
      onClick: () => {
        new PopupSponsored();
      },
      verify: () => false,
      isSponsored: true
    }];
  }

  private init() {
    this.cleanup();
    this.setButtons();
    
    const filteredButtons = this.filterButtons(this.buttons);
    const element = this.element = ButtonMenu(filteredButtons, this.listenerSetter);
    element.id = 'bubble-contextmenu';
    element.classList.add('contextmenu');

    const viewsButton = filteredButtons.find(button => !button.icon);
    if(viewsButton) {
      const recentReactions = (this.message as Message.message).reactions?.recent_reactons;
      const isViewingReactions = !!recentReactions?.length;
      const participantsCount = (this.appPeersManager.getPeer(this.peerId) as MTChat.chat).participants_count;

      viewsButton.element.classList.add('tgico-' + (isViewingReactions ? 'reactions' : 'checks'));
      const i18nElem = new I18n.IntlElement({
        key: isViewingReactions ? 'Chat.Context.Reacted' : 'NobodyViewed',
        args: isViewingReactions ? [participantsCount, participantsCount] : undefined,
        element: viewsButton.textElement
      });

      let fakeText: HTMLElement;
      if(isViewingReactions) {
        fakeText = i18n(
          recentReactions.length === participantsCount ? 'Chat.Context.ReactedFast' : 'Chat.Context.Reacted', 
          [recentReactions.length, participantsCount]
        );
      } else {
        fakeText = i18n('Loading');
      }

      fakeText.classList.add('btn-menu-item-text-fake');
      viewsButton.element.append(fakeText);

      const PADDING_PER_AVATAR = .875;
      i18nElem.element.style.visibility = 'hidden';
      i18nElem.element.style.paddingRight = isViewingReactions ? PADDING_PER_AVATAR * recentReactions.length + 'rem' : '1rem';
      const middleware = this.middleware.get();
      this.appMessagesManager.getMessageReactionsListAndReadParticipants(this.message as Message.message).then((result) => {
        if(!middleware()) {
          return;
        }

        if(fakeText) {
          fakeText.remove();
        }

        const reactions = result.combined;
        const reactedLength = isViewingReactions ? reactions.filter(reaction => reaction.reaction).length : reactions.length;

        let fakeElem: HTMLElement;
        if(reactions.length === 1) {
          fakeElem = new PeerTitle({
            peerId: reactions[0].peerId,
            onlyFirstName: true,
            dialog: true
          }).element;

          this.viewerPeerId = reactions[0].peerId;
        } else if(isViewingReactions) {
          const isFull = reactedLength === reactions.length;
          fakeElem = i18n(
            isFull ? 'Chat.Context.ReactedFast' : 'Chat.Context.Reacted', 
            [reactedLength, reactions.length]
          );
        } else {
          if(!reactions.length) {
            i18nElem.element.style.visibility = '';
          } else {
            fakeElem = i18n('MessageSeen', [reactions.length]);
          }
        }

        if(fakeElem) {
          fakeElem.style.paddingRight = PADDING_PER_AVATAR * reactedLength + 'rem';
          fakeElem.classList.add('btn-menu-item-text-fake');
          viewsButton.element.append(fakeElem);
        }

        if(reactions.length) {
          const avatars = new StackedAvatars({avatarSize: 24});
          avatars.render(recentReactions ? recentReactions.map(r => r.user_id.toPeerId()) : reactions.map(reaction => reaction.peerId));
          viewsButton.element.append(avatars.container);
        }
      });
    }

    let menuPadding: MenuPositionPadding;
    let reactionsMenu: ChatReactionsMenu;
    if(this.message._ === 'message') {
      const position: 'horizontal' | 'vertical' = IS_APPLE || IS_TOUCH_SUPPORTED ? 'horizontal' : 'vertical';
      reactionsMenu = this.reactionsMenu = new ChatReactionsMenu(this.appReactionsManager, position, this.middleware);
      reactionsMenu.init(this.message);
      element.prepend(reactionsMenu.widthContainer);

      const size = 42;
      const margin = 8;
      const totalSize = size + margin;
      if(position === 'vertical') {
        menuPadding = {
          top: 24,
          // bottom: 36, // positionMenu will detect it itself somehow
          left: totalSize
        };
      } else {
        menuPadding = {
          top: totalSize,
          right: 36,
          left: 24
        };
      }
    }

    this.chat.container.append(element);

    return {
      element, 
      cleanup: () => {
        this.cleanup();
        reactionsMenu && reactionsMenu.cleanup();
      },
      destroy: () => {
        element.remove();
      },
      menuPadding
    };
  }

  private onSendScheduledClick = () => {
    if(this.chat.selection.isSelecting) {
      simulateClickEvent(this.chat.selection.selectionSendNowBtn);
    } else {
      new PopupSendNow(this.peerId, this.chat.getMidsByMid(this.mid));
    }
  };

  private onReplyClick = () => {
    this.chat.input.initMessageReply(this.mid);
  };

  private onEditClick = () => {
    this.chat.input.initMessageEditing(this.mid);
  };

  private onCopyClick = () => {
    if(isSelectionEmpty()) {
      const mids = this.chat.selection.isSelecting ? 
        [...this.chat.selection.selectedMids.get(this.peerId)].sort((a, b) => a - b) : 
        [this.mid];

      const str = mids.reduce((acc, mid) => {
        const message = this.chat.getMessage(mid);
        return acc + (message?.message ? message.message + '\n' : '');
      }, '').trim();

      copyTextToClipboard(str);
    } else {
      document.execCommand('copy');
      //cancelSelection();
    }
  };

  private onCopyAnchorLinkClick = () => {
    copyTextToClipboard((this.target as HTMLAnchorElement).href);
  };

  private onCopyLinkClick = () => {
    let threadMessage: Message.message;
    if(this.chat.type === 'discussion') {
      threadMessage = this.appMessagesManager.getMessageByPeer(this.peerId, this.chat.threadId);
    }

    const username = this.appPeersManager.getPeerUsername(threadMessage ? threadMessage.fromId : this.peerId);
    const msgId = this.appMessagesIdsManager.getServerMessageId(this.mid);
    let url = 'https://t.me/';
    let key: LangPackKey;
    if(username) {
      url += username + '/' + (threadMessage ? this.appMessagesIdsManager.getServerMessageId(threadMessage.fwd_from.channel_post) : msgId);
      if(threadMessage) url += '?comment=' + msgId;
      key = 'LinkCopied';
    } else {
      url += 'c/' + this.peerId.toChatId() + '/' + msgId;
      if(threadMessage) url += '?thread=' + this.appMessagesIdsManager.getServerMessageId(threadMessage.mid);
      key = 'LinkCopiedPrivateInfo';
    }

    toast(I18n.format(key, true));

    copyTextToClipboard(url);
  };

  private onPinClick = () => {
    new PopupPinMessage(this.peerId, this.mid);
  };

  private onUnpinClick = () => {
    new PopupPinMessage(this.peerId, this.mid, true);
  };

  private onRetractVote = () => {
    this.appPollsManager.sendVote(this.message, []);
  };

  private onStopPoll = () => {
    this.appPollsManager.stopPoll(this.message);
  };

  private onForwardClick = () => {
    if(this.chat.selection.isSelecting) {
      simulateClickEvent(this.chat.selection.selectionForwardBtn);
    } else {
      const mids = this.isTargetAGroupedItem ? [this.mid] : this.chat.getMidsByMid(this.mid);
      new PopupForward({
        [this.peerId]: mids
      });
    }
  };

  private onSelectClick = () => {
    this.chat.selection.toggleByElement(findUpClassName(this.target, 'grouped-item') || findUpClassName(this.target, 'bubble'));
  };

  private onClearSelectionClick = () => {
    this.chat.selection.cancelSelection();
  };

  private onDeleteClick = () => {
    if(this.chat.selection.isSelecting) {
      simulateClickEvent(this.chat.selection.selectionDeleteBtn);
    } else {
      new PopupDeleteMessages(this.peerId, this.isTargetAGroupedItem ? [this.mid] : this.chat.getMidsByMid(this.mid), this.chat.type);
    }
  };
}
