﻿(function () {

    function initSdk() {

        var manager = ConnectSDK.discoveryManager;

        //manager.setPairingLevel(ConnectSDK.PairingLevel.OFF);
        manager.setAirPlayServiceMode(ConnectSDK.AirPlayServiceMode.Media);

        // Show devices that support playing videos and pausing
        //manager.setCapabilityFilters([
        //  new ConnectSDK.CapabilityFilter(["MediaPlayer.Display.Video", "MediaControl.Pause"])
        //]);

        //manager.on('devicelistchanged', onDeviceListChanged);

        manager.startDiscovery();

        requirejs(['cordova/connectsdk/chromecast']);

        if (browserInfo.safari) {
            requirejs(['cordova/connectsdk/generaldevice']);
        }
    }

    function getDeviceList() {
        return ConnectSDK.discoveryManager.getDeviceList();
    }

    window.ConnectSDKHelper = {

        getDeviceList: getDeviceList
    };

    initSdk();

})();