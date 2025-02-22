﻿(function () {

    function changeCollectionType(page, virtualFolder) {

        Dashboard.alert({
            message: Globalize.translate('HeaderChangeFolderTypeHelp'),
            title: Globalize.translate('HeaderChangeFolderType')
        });
    }

    function addVirtualFolder(page) {

        require(['medialibrarycreator'], function (medialibrarycreator) {

            new medialibrarycreator().show({

                collectionTypeOptions: getCollectionTypeOptions(),
                refresh: shouldRefreshLibraryAfterChanges(page)

            }).then(function (hasChanges) {

                if (hasChanges) {
                    reloadLibrary(page);
                }
            });
        });
    }

    function editVirtualFolder(page, virtualFolder) {

        require(['medialibraryeditor'], function (medialibraryeditor) {

            new medialibraryeditor().show({

                refresh: shouldRefreshLibraryAfterChanges(page),
                library: virtualFolder

            }).then(function (hasChanges) {

                if (hasChanges) {
                    reloadLibrary(page);
                }
            });
        });
    }

    function deleteVirtualFolder(page, virtualFolder) {

        var msg = Globalize.translate('MessageAreYouSureYouWishToRemoveMediaFolder');

        if (virtualFolder.Locations.length) {
            msg += "<br/><br/>" + Globalize.translate("MessageTheFollowingLocationWillBeRemovedFromLibrary") + "<br/><br/>";
            msg += virtualFolder.Locations.join("<br/>");
        }

        Dashboard.confirm(msg, Globalize.translate('HeaderRemoveMediaFolder'), function (confirmResult) {

            if (confirmResult) {

                var refreshAfterChange = shouldRefreshLibraryAfterChanges(page);

                ApiClient.removeVirtualFolder(virtualFolder.Name, refreshAfterChange).then(function () {
                    reloadLibrary(page);
                });
            }

        });
    }

    function renameVirtualFolder(page, virtualFolder) {

        require(['prompt'], function (prompt) {

            prompt({
                title: Globalize.translate('LabelNewName'),
                callback: function (newName) {

                    if (newName && newName != virtualFolder.Name) {

                        var refreshAfterChange = shouldRefreshLibraryAfterChanges(page);

                        ApiClient.renameVirtualFolder(virtualFolder.Name, newName, refreshAfterChange).then(function () {
                            reloadLibrary(page);
                        });
                    }
                }
            });

        });
    }

    function showCardMenu(page, elem, virtualFolders) {

        var card = $(elem).parents('.card')[0];
        var index = parseInt(card.getAttribute('data-index'));
        var virtualFolder = virtualFolders[index];

        var menuItems = [];

        menuItems.push({
            name: Globalize.translate('ButtonChangeContentType'),
            id: 'changetype',
            ironIcon: 'videocam'
        });

        menuItems.push({
            name: Globalize.translate('ButtonManageFolders'),
            id: 'edit',
            ironIcon: 'folder-open'
        });

        menuItems.push({
            name: Globalize.translate('ButtonRemove'),
            id: 'delete',
            ironIcon: 'remove'
        });

        menuItems.push({
            name: Globalize.translate('ButtonRename'),
            id: 'rename',
            ironIcon: 'mode-edit'
        });

        require(['actionsheet'], function (actionsheet) {

            actionsheet.show({
                items: menuItems,
                positionTo: elem,
                callback: function (resultId) {

                    switch (resultId) {

                        case 'changetype':
                            changeCollectionType(page, virtualFolder);
                            break;
                        case 'edit':
                            editVirtualFolder(page, virtualFolder);
                            break;
                        case 'rename':
                            renameVirtualFolder(page, virtualFolder);
                            break;
                        case 'delete':
                            deleteVirtualFolder(page, virtualFolder);
                            break;
                        default:
                            break;
                    }
                }
            });

        });
    }

    function reloadLibrary(page) {

        Dashboard.showLoadingMsg();

        ApiClient.getVirtualFolders().then(function (result) {
            reloadVirtualFolders(page, result);
        });
    }

    function shouldRefreshLibraryAfterChanges(page) {

        return $(page).is('#mediaLibraryPage');
    }

    function reloadVirtualFolders(page, virtualFolders) {

        var html = '';

        virtualFolders.push({
            Name: Globalize.translate('ButtonAddMediaLibrary'),
            icon: 'add-circle',
            Locations: [],
            showType: false,
            showLocations: false,
            showMenu: false,
            showNameWithIcon: true
        });

        for (var i = 0, length = virtualFolders.length; i < length; i++) {

            var virtualFolder = virtualFolders[i];

            html += getVirtualFolderHtml(page, virtualFolder, i);
        }

        var divVirtualFolders = page.querySelector('#divVirtualFolders');
        divVirtualFolders.innerHTML = html;

        $('.btnCardMenu', divVirtualFolders).on('click', function () {
            showCardMenu(page, this, virtualFolders);
        });

        $('.addLibrary', divVirtualFolders).on('click', function () {
            addVirtualFolder(page);
        });

        $('.editLibrary', divVirtualFolders).on('click', function () {
            var card = $(this).parents('.card')[0];
            var index = parseInt(card.getAttribute('data-index'));
            var virtualFolder = virtualFolders[index];

            if (!virtualFolder.ItemId) {
                return;
            }

            require(['components/imageeditor/imageeditor'], function (ImageEditor) {

                ImageEditor.show(virtualFolder.ItemId, {
                    theme: 'a'
                }).then(function (hasChanged) {
                    if (hasChanged) {
                        reloadLibrary(page);
                    }
                });
            });
        });

        Dashboard.hideLoadingMsg();
    }

    function getCollectionTypeOptions() {

        return [

            { name: "", value: "" },
            { name: Globalize.translate('FolderTypeMovies'), value: "movies" },
            { name: Globalize.translate('FolderTypeMusic'), value: "music" },
            { name: Globalize.translate('FolderTypeTvShows'), value: "tvshows" },
            { name: Globalize.translate('FolderTypeBooks'), value: "books", message: Globalize.translate('MessageBookPluginRequired') },
            { name: Globalize.translate('FolderTypeGames'), value: "games", message: Globalize.translate('MessageGamePluginRequired') },
            { name: Globalize.translate('FolderTypeHomeVideos'), value: "homevideos" },
            { name: Globalize.translate('FolderTypeMusicVideos'), value: "musicvideos" },
            { name: Globalize.translate('FolderTypePhotos'), value: "photos" },
            { name: Globalize.translate('FolderTypeUnset'), value: "mixed", message: Globalize.translate('MessageUnsetContentHelp') }
        ];

    }

    function getIcon(type) {

        switch (type) {
            case "movies":
                return "local-movies";
            case "music":
                return "library-music";
            case "photos":
                return "photo";
            case "livetv":
                return "live-tv";
            case "tvshows":
                return "live-tv";
            case "games":
                return "folder";
            case "trailers":
                return "local-movies";
            case "homevideos":
                return "video-library";
            case "musicvideos":
                return "video-library";
            case "books":
                return "folder";
            case "channels":
                return "folder";
            case "playlists":
                return "folder";
            default:
                return "folder";
        }
    }

    function getVirtualFolderHtml(page, virtualFolder, index) {

        var html = '';

        var style = "";

        if (page.classList.contains('wizardPage')) {
            style += "min-width:33.3%;";
        }

        html += '<div class="card backdropCard" style="' + style + '" data-index="' + index + '">';

        html += '<div class="cardBox visualCardBox">';
        html += '<div class="cardScalable">';

        html += '<div class="cardPadder"></div>';

        html += '<div class="cardContent">';
        var imgUrl = '';

        if (virtualFolder.PrimaryImageItemId) {
            imgUrl = ApiClient.getScaledImageUrl(virtualFolder.PrimaryImageItemId, {
                type: 'Primary'
            });
        }

        if (imgUrl) {
            html += '<div class="cardImage editLibrary" style="cursor:pointer;background-image:url(\'' + imgUrl + '\');"></div>';
        } else if (!virtualFolder.showNameWithIcon) {
            html += '<div class="cardImage editLibrary iconCardImage" style="cursor:pointer;">';
            html += '<iron-icon icon="' + (virtualFolder.icon || getIcon(virtualFolder.CollectionType)) + '"></iron-icon>';

            html += '</div>';
        }

        // cardContent
        html += "</div>";

        // cardScalable
        html += "</div>";

        if (!imgUrl && virtualFolder.showNameWithIcon) {
            html += '<div class="cardImage iconCardImage addLibrary" style="position:absolute;top:0;left:0;right:0;bottom:0;font-size:140%;cursor:pointer;">';

            html += '<div>';
            html += '<iron-icon icon="' + (virtualFolder.icon || getIcon(virtualFolder.CollectionType)) + '" style="width:45%;height:45%;color:#888;"></iron-icon>';

            if (virtualFolder.showNameWithIcon) {
                html += '<div style="margin:1.5em 0;position:width:100%;font-weight:500;color:#444;">';
                html += virtualFolder.Name;
                html += "</div>";
            }
            html += "</div>";

            html += '</div>';
        }

        html += '<div class="cardFooter">';

        if (virtualFolder.showMenu !== false) {
            html += '<div class="cardText" style="text-align:right; float:right;padding-top:5px;">';
            html += '<paper-icon-button icon="' + AppInfo.moreIcon + '" class="btnCardMenu"></paper-icon-button>';
            html += "</div>";
        }

        html += "<div class='cardText'>";
        if (virtualFolder.showNameWithIcon) {
            html += '&nbsp;';
        } else {
            html += virtualFolder.Name;
        }
        html += "</div>";

        var typeName = getCollectionTypeOptions().filter(function (t) {

            return t.value == virtualFolder.CollectionType;

        })[0];

        typeName = typeName ? typeName.name : Globalize.translate('FolderTypeUnset');

        html += "<div class='cardText'>";
        if (virtualFolder.showType === false) {
            html += '&nbsp;';
        } else {
            html += typeName;
        }
        html += "</div>";

        if (virtualFolder.showLocations === false) {
            html += "<div class='cardText'>";
            html += '&nbsp;';
            html += "</div>";
        } else if (!virtualFolder.Locations.length) {
            html += "<div class='cardText' style='color:#cc3333;'>";
            html += Globalize.translate('NumLocationsValue', virtualFolder.Locations.length);
            html += "</div>";
        }
        else if (virtualFolder.Locations.length == 1) {
            html += "<div class='cardText'>";
            html += virtualFolder.Locations[0];
            html += "</div>";
        }
        else {
            html += "<div class='cardText'>";
            html += Globalize.translate('NumLocationsValue', virtualFolder.Locations.length);
            html += "</div>";
        }

        // cardFooter
        html += "</div>";

        // cardBox
        html += "</div>";

        // card
        html += "</div>";

        return html;
    }

    pageClassOn('pageinit', "mediaLibraryPage", function () {

        var page = this;
        $('#selectCollectionType', page).on('change', function () {

            var index = this.selectedIndex;
            if (index != -1) {

                var name = this.options[index].innerHTML
                    .replace('*', '')
                    .replace('&amp;', '&');

                var value = this.value;

                $('#txtValue', page).val(name);

                var folderOption = getCollectionTypeOptions().filter(function (i) {

                    return i.value == value;

                })[0];

                $('.collectionTypeFieldDescription', page).html(folderOption.message || '');
            }
        });
    });

    pageClassOn('pageshow', "mediaLibraryPage", function () {

        var page = this;
        reloadLibrary(page);

    });

})();

var WizardLibraryPage = {

    next: function () {

        Dashboard.showLoadingMsg();

        var apiClient = ApiClient;

        apiClient.ajax({
            type: "POST",
            url: apiClient.getUrl('System/Configuration/MetadataPlugins/Autoset')

        }).then(function () {

            Dashboard.hideLoadingMsg();
            Dashboard.navigate('wizardsettings.html');
        });
    }
};

(function ($, document, window) {

    pageIdOn('pageshow', "mediaLibraryPage", function () {

        var page = this;

        // on here
        $('.btnRefresh', page).taskButton({
            mode: 'on',
            progressElem: page.querySelector('.refreshProgress'),
            taskKey: 'RefreshLibrary'
        });

    });

    pageIdOn('pagebeforehide', "mediaLibraryPage", function () {

        var page = this;

        // off here
        $('.btnRefresh', page).taskButton({
            mode: 'off'
        });

    });

})(jQuery, document, window);