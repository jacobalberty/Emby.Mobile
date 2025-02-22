﻿(function ($, document, window) {

    var currentConfig;

    function remove(page, index) {

        require(['confirm'], function (confirm) {

            confirm(Globalize.translate('MessageConfirmPathSubstitutionDeletion'), Globalize.translate('HeaderConfirmDeletion')).then(function () {

                ApiClient.getServerConfiguration().then(function (config) {

                    config.PathSubstitutions.splice(index, 1);

                    ApiClient.updateServerConfiguration(config).then(function () {

                        reload(page);
                    });
                });
            });
        });
    }

    function addSubstitution(page, config) {

        config.PathSubstitutions.push({
            From: $('#txtFrom', page).val(),
            To: $('#txtTo', page).val()
        });

    }

    function reloadPathMappings(page, config) {

        var index = 0;

        var html = config.PathSubstitutions.map(function (map) {

            var mapHtml = '';
            mapHtml += '<paper-icon-item>';

            mapHtml += '<paper-fab mini icon="folder" class="blue" item-icon></paper-fab>';

            mapHtml += '<paper-item-body three-line>';

            mapHtml += "<div>" + map.From + "</div>";
            mapHtml += "<div secondary><b>" + Globalize.translate('HeaderTo') + "</b></div>";
            mapHtml += "<div secondary>" + map.To + "</div>";

            mapHtml += '</paper-item-body>';

            mapHtml += '<paper-icon-button data-index="' + index + '" icon="delete" class="btnDeletePath"></paper-icon-button>';

            mapHtml += '</paper-icon-item>';

            index++;

            return mapHtml;

        }).join('');

        if (config.PathSubstitutions.length) {
            html = '<div class="paperList">' + html + '</div>';
        } 

        var elem = $('.pathSubstitutions', page).html(html);

        $('.btnDeletePath', elem).on('click', function () {

            remove(page, parseInt(this.getAttribute('data-index')));
        });
    }

    function loadPage(page, config) {

        currentConfig = config;

        require(['paper-fab', 'paper-item-body', 'paper-icon-item'], function () {
            reloadPathMappings(page, config);
            Dashboard.hideLoadingMsg();
        });
    }

    function reload(page) {

        $('#txtFrom', page).val('');
        $('#txtTo', page).val('');

        ApiClient.getServerConfiguration().then(function (config) {

            loadPage(page, config);

        });
    }

    function onSubmit() {
        Dashboard.showLoadingMsg();

        var form = this;
        var page = $(form).parents('.page');

        ApiClient.getServerConfiguration().then(function (config) {

            addSubstitution(page, config);
            ApiClient.updateServerConfiguration(config).then(function () {

                reload(page);
            });
        });

        // Disable default form submission
        return false;
    }

    $(document).on('pageinit', "#libraryPathMappingPage", function () {

        var page = this;

        $('.libraryPathMappingForm').off('submit', onSubmit).on('submit', onSubmit);

        page.querySelector('.labelFromHelp').innerHTML = Globalize.translate('LabelFromHelp', 'D:\\Movies');

    }).on('pageshow', "#libraryPathMappingPage", function () {

        Dashboard.showLoadingMsg();

        var page = this;

        ApiClient.getServerConfiguration().then(function (config) {

            loadPage(page, config);

        });

    }).on('pagebeforehide', "#libraryPathMappingPage", function () {

        currentConfig = null;

    });

})(jQuery, document, window);
