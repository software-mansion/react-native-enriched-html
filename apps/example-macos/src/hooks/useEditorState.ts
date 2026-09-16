import { useRef, useState } from 'react';
import type {
  EnrichedTextInputInstance,
  OnChangeMentionEvent,
  OnChangeSelectionEvent,
  OnChangeStateEvent,
  OnLinkDetected,
} from 'react-native-enriched-html';
import type { MentionItem } from '../components/MentionPopup';
import { useChannelMention } from './useChannelMention';
import { useUserMention } from './useUserMention';

type CurrentLinkState = OnLinkDetected;

const DEFAULT_LINK_STATE: CurrentLinkState = {
  text: '',
  url: '',
  start: 0,
  end: 0,
};

interface Selection {
  start: number;
  end: number;
  text: string;
}

export function useEditorState() {
  const ref = useRef<EnrichedTextInputInstance>(null);

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isUserPopupOpen, setIsUserPopupOpen] = useState(false);
  const [isChannelPopupOpen, setIsChannelPopupOpen] = useState(false);
  const [currentHtml, setCurrentHtml] = useState('');
  const [selection, setSelection] = useState<Selection>();
  const [stylesState, setStylesState] = useState<OnChangeStateEvent | null>(
    null
  );
  const [currentLink, setCurrentLink] =
    useState<CurrentLinkState>(DEFAULT_LINK_STATE);

  const userMention = useUserMention();
  const channelMention = useChannelMention();

  const insideCurrentLink = Boolean(
    stylesState?.link.isActive &&
    currentLink.url.length > 0 &&
    (currentLink.start || currentLink.end) &&
    selection &&
    selection.start >= currentLink.start &&
    selection.end <= currentLink.end
  );

  const handleChangeHtml = (html: string) => {
    setCurrentHtml(html);
  };

  const handleChangeState = (state: OnChangeStateEvent) => {
    setStylesState(state);
  };

  const handleLinkDetected = (state: CurrentLinkState) => {
    setCurrentLink(state);
  };

  const handleSelectionChange = (sel: OnChangeSelectionEvent) => {
    setSelection(sel);
  };

  const openLinkModal = () => setIsLinkModalOpen(true);
  const closeLinkModal = () => setIsLinkModalOpen(false);
  const openImageModal = () => setIsImageModalOpen(true);
  const closeImageModal = () => setIsImageModalOpen(false);

  const openUserMentionPopup = () => setIsUserPopupOpen(true);
  const closeUserMentionPopup = () => {
    setIsUserPopupOpen(false);
    userMention.onMentionChange('');
  };

  const openChannelMentionPopup = () => setIsChannelPopupOpen(true);
  const closeChannelMentionPopup = () => {
    setIsChannelPopupOpen(false);
    channelMention.onMentionChange('');
  };

  const handleStartMention = (indicator: string) => {
    console.log('start mention', indicator);
    if (indicator === '@') {
      userMention.onMentionChange('');
      openUserMentionPopup();
      return;
    }
    channelMention.onMentionChange('');
    openChannelMentionPopup();
  };

  const handleChangeMention = ({ indicator, text }: OnChangeMentionEvent) => {
    console.log('change mention', indicator);
    if (indicator === '@') {
      userMention.onMentionChange(text);
      if (!isUserPopupOpen) setIsUserPopupOpen(true);
      return;
    }
    channelMention.onMentionChange(text);
    if (!isChannelPopupOpen) setIsChannelPopupOpen(true);
  };

  const handleEndMention = (indicator: string) => {
    console.log('end mention', indicator);
    if (indicator === '@') {
      closeUserMentionPopup();
      return;
    }
    closeChannelMentionPopup();
  };

  const handleUserMentionSelected = (item: MentionItem) => {
    ref.current?.setMention('@', `@${item.name}`, {
      id: item.id,
      type: 'user',
    });
  };

  const handleChannelMentionSelected = (item: MentionItem) => {
    ref.current?.setMention('#', `#${item.name}`, {
      id: item.id,
      type: 'channel',
    });
  };

  const submitLink = (text: string, url: string) => {
    if (!selection || url.length === 0) {
      closeLinkModal();
      return;
    }
    const newText = text.length > 0 ? text : url;
    if (insideCurrentLink) {
      ref.current?.setLink(currentLink.start, currentLink.end, newText, url);
    } else {
      ref.current?.setLink(selection.start, selection.end, newText, url);
    }
    closeLinkModal();
  };

  const submitImage = (
    width: number | undefined,
    height: number | undefined,
    url: string
  ) => {
    ref.current?.setImage(url, width ?? 80, height ?? 80);
    closeImageModal();
  };

  const refresh = () => {
    ref.current?.setValue('');
    setCurrentHtml('');
  };

  return {
    ref,
    stylesState,
    currentHtml,
    selection,
    currentLink,
    insideCurrentLink,
    isLinkModalOpen,
    isImageModalOpen,
    isUserPopupOpen,
    isChannelPopupOpen,
    userMention,
    channelMention,
    openLinkModal,
    closeLinkModal,
    openImageModal,
    closeImageModal,
    handleChangeHtml,
    handleChangeState,
    handleLinkDetected,
    handleSelectionChange,
    handleStartMention,
    handleChangeMention,
    handleEndMention,
    handleUserMentionSelected,
    handleChannelMentionSelected,
    submitLink,
    submitImage,
    refresh,
  };
}
