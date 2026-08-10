declare const tabs: {
    openTab: () => Promise<undefined>;
    openOrSwitchTab: () => Promise<undefined>;
    closeCurrentTab: () => Promise<undefined>;
    closeTab: () => Promise<undefined>;
    closeOtherTabs: () => Promise<undefined>;
    sendToOpenerTab: () => Promise<undefined>;
    updateTabTitle: () => Promise<undefined>;
};
export default tabs;
