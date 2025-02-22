﻿define(['browser'], function (browser) {

    function canPlayH264() {
        var v = document.createElement('video');
        return !!(v.canPlayType && v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, ''));
    }

    var _supportsTextTracks;
    function supportsTextTracks() {

        if (_supportsTextTracks == null) {
            _supportsTextTracks = document.createElement('video').textTracks != null;
        }

        // For now, until ready
        return _supportsTextTracks;
    }

    var _canPlayHls;
    function canPlayHls(src) {

        if (_canPlayHls == null) {
            _canPlayHls = canPlayNativeHls() || canPlayHlsWithMSE();
        }
        return _canPlayHls;
    }

    function canPlayNativeHls() {
        var media = document.createElement('video');

        if (media.canPlayType('application/x-mpegURL').replace(/no/, '') ||
            media.canPlayType('application/vnd.apple.mpegURL').replace(/no/, '')) {
            return true;
        }

        return false;
    }

    function canPlayHlsWithMSE() {
        if (window.MediaSource != null) {
            // text tracks don’t work with this in firefox
            return !browser.firefox;
        }

        return false;
    }

    function canPlayAudioFormat(format) {

        var typeString;

        if (format == 'opus') {
            typeString = 'audio/ogg; codecs="opus"';

            if (document.createElement('audio').canPlayType(typeString).replace(/no/, '')) {
                return true;
            }

            // Newer mobile chrome supports it but doesn't report it
            if (browser.chrome) {
                var version = (browser.version || '').toString().split('.')[0];
                try {
                    version = parseInt(version);
                    if (version >= 48) {
                        return true;
                    }
                } catch (err) {

                }
            }
            return false;
        }

        if (format == 'webma') {
            typeString = 'audio/webm';
        } else {
            typeString = 'audio/' + format;
        }

        if (document.createElement('audio').canPlayType(typeString).replace(/no/, '')) {
            return true;
        }

        return false;
    }

    return function () {

        var bitrateSetting = 100000000;

        var videoTestElement = document.createElement('video');

        var canPlayWebm = videoTestElement.canPlayType('video/webm').replace(/no/, '');
        // No real way to detect this, but it's too good to pass up
        var canPlayMkv = browser.chrome;

        var profile = {};

        profile.MaxStreamingBitrate = bitrateSetting;
        profile.MaxStaticBitrate = 100000000;
        profile.MusicStreamingTranscodingBitrate = Math.min(bitrateSetting, 192000);

        profile.DirectPlayProfiles = [];

        var videoAudioCodecs = [];

        var supportsMp3VideoAudio = videoTestElement.canPlayType('video/mp4; codecs="avc1.640029, mp4a.69"').replace(/no/, '') ||
            videoTestElement.canPlayType('video/mp4; codecs="avc1.640029, mp4a.6B"').replace(/no/, '');

        // Only put mp3 first if mkv support is there
        // Otherwise with HLS and mp3 audio we're seeing some browsers
        if (videoTestElement.canPlayType('audio/mp4; codecs="ac-3"').replace(/no/, '')) {
            // safari is lying
            if (!browser.safari) {
                videoAudioCodecs.push('ac3');
            }
        }
        if (canPlayMkv) {
            if (supportsMp3VideoAudio) {
                videoAudioCodecs.push('mp3');
            }
        }
        if (videoTestElement.canPlayType('video/mp4; codecs="avc1.640029, mp4a.40.2"').replace(/no/, '')) {
            videoAudioCodecs.push('aac');
        }
        if (!canPlayMkv) {
            if (supportsMp3VideoAudio) {
                videoAudioCodecs.push('mp3');
            }
        }

        if (canPlayH264()) {
            profile.DirectPlayProfiles.push({
                Container: 'mp4,m4v',
                Type: 'Video',
                VideoCodec: 'h264',
                AudioCodec: videoAudioCodecs.join(',')
            });
        }

        if (canPlayMkv) {
            profile.DirectPlayProfiles.push({
                Container: 'mkv,mov',
                Type: 'Video',
                VideoCodec: 'h264',
                AudioCodec: videoAudioCodecs.join(',')
            });
        }

        ['opus', 'mp3', 'aac', 'flac', 'webma'].filter(canPlayAudioFormat).forEach(function (audioFormat) {

            profile.DirectPlayProfiles.push({
                Container: audioFormat == 'webma' ? 'webma,webm' : audioFormat,
                Type: 'Audio'
            });
        });

        if (canPlayWebm) {
            profile.DirectPlayProfiles.push({
                Container: 'webm',
                Type: 'Video'
            });
        }

        profile.TranscodingProfiles = [];

        ['opus', 'mp3', 'aac'].filter(canPlayAudioFormat).forEach(function (audioFormat) {

            profile.TranscodingProfiles.push({
                Container: audioFormat,
                Type: 'Audio',
                AudioCodec: audioFormat,
                Context: 'Streaming',
                Protocol: 'http'
            });
            profile.TranscodingProfiles.push({
                Container: audioFormat,
                Type: 'Audio',
                AudioCodec: audioFormat,
                Context: 'Static',
                Protocol: 'http'
            });
        });

        // Can't use mkv on mobile because we have to use the native player controls and they won't be able to seek it
        if (canPlayMkv && !browser.mobile) {
            profile.TranscodingProfiles.push({
                Container: 'mkv',
                Type: 'Video',
                AudioCodec: videoAudioCodecs.join(','),
                VideoCodec: 'h264',
                Context: 'Streaming'
            });
        }

        if (canPlayHls()) {
            profile.TranscodingProfiles.push({
                Container: 'ts',
                Type: 'Video',
                AudioCodec: videoAudioCodecs.join(','),
                VideoCodec: 'h264',
                Context: 'Streaming',
                Protocol: 'hls'
            });
        }

        if (canPlayWebm) {

            profile.TranscodingProfiles.push({
                Container: 'webm',
                Type: 'Video',
                AudioCodec: 'vorbis',
                VideoCodec: 'vpx',
                Context: 'Streaming',
                Protocol: 'http'
            });
        }

        profile.TranscodingProfiles.push({
            Container: 'mp4',
            Type: 'Video',
            AudioCodec: videoAudioCodecs.join(','),
            VideoCodec: 'h264',
            Context: 'Streaming',
            Protocol: 'http'
        });

        profile.TranscodingProfiles.push({
            Container: 'mp4',
            Type: 'Video',
            AudioCodec: videoAudioCodecs.join(','),
            VideoCodec: 'h264',
            Context: 'Static',
            Protocol: 'http'
        });

        profile.ContainerProfiles = [];

        profile.CodecProfiles = [];
        profile.CodecProfiles.push({
            Type: 'Audio',
            Conditions: [{
                Condition: 'LessThanEqual',
                Property: 'AudioChannels',
                Value: '2'
            }]
        });

        var videoAudioChannels = '6';

        // Handle he-aac not supported
        if (!videoTestElement.canPlayType('video/mp4; codecs="avc1.640029, mp4a.40.5"').replace(/no/, '')) {
            profile.CodecProfiles.push({
                Type: 'VideoAudio',
                Codec: 'aac',
                Conditions: [
                    {
                        Condition: 'NotEquals',
                        Property: 'AudioProfile',
                        Value: 'HE-AAC'
                    },
                    {
                        Condition: 'LessThanEqual',
                        Property: 'AudioChannels',
                        Value: videoAudioChannels
                    },
                    {
                        Condition: 'Equals',
                        Property: 'IsSecondaryAudio',
                        Value: 'false',
                        IsRequired: 'false'
                    }
                ]
            });
        }

        profile.CodecProfiles.push({
            Type: 'VideoAudio',
            Conditions: [
                {
                    Condition: 'LessThanEqual',
                    Property: 'AudioChannels',
                    Value: videoAudioChannels
                },
                {
                    Condition: 'Equals',
                    Property: 'IsSecondaryAudio',
                    Value: 'false',
                    IsRequired: 'false'
                }
            ]
        });

        profile.CodecProfiles.push({
            Type: 'Video',
            Codec: 'h264',
            Conditions: [
            {
                Condition: 'NotEquals',
                Property: 'IsAnamorphic',
                Value: 'true',
                IsRequired: false
            },
            {
                Condition: 'EqualsAny',
                Property: 'VideoProfile',
                Value: 'high|main|baseline|constrained baseline'
            },
            {
                Condition: 'LessThanEqual',
                Property: 'VideoLevel',
                Value: '41'
            }]
        });

        profile.CodecProfiles.push({
            Type: 'Video',
            Codec: 'vpx',
            Conditions: [
            {
                Condition: 'NotEquals',
                Property: 'IsAnamorphic',
                Value: 'true',
                IsRequired: false
            }]
        });

        // Subtitle profiles
        // External vtt or burn in
        profile.SubtitleProfiles = [];
        if (supportsTextTracks()) {

            profile.SubtitleProfiles.push({
                Format: 'vtt',
                Method: 'External'
            });
        }

        profile.ResponseProfiles = [];

        profile.ResponseProfiles.push({
            Type: 'Video',
            Container: 'm4v',
            MimeType: 'video/mp4'
        });

        profile.ResponseProfiles.push({
            Type: 'Video',
            Container: 'mov',
            MimeType: 'video/webm'
        });

        return profile;
    }();
});