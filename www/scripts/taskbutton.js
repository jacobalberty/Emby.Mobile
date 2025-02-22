﻿define(['appStorage'], function (appStorage) {

    $.fn.taskButton = function (options) {

        function pollTasks(button) {

            ApiClient.getScheduledTasks({

                IsEnabled: true

            }).then(function (tasks) {

                updateTasks(button, tasks);
            });

        }

        function updateTasks(button, tasks) {

            var task = tasks.filter(function (t) {

                return t.Key == options.taskKey;

            })[0];

            if (options.panel) {
                if (task) {
                    $(options.panel).show();
                } else {
                    $(options.panel).hide();
                }
            }

            if (!task) {
                return;
            }

            if (task.State == 'Idle') {
                $(button).removeAttr('disabled');
            } else {
                $(button).attr('disabled', 'disabled');
            }

            $(button).attr('data-taskid', task.Id);

            var progress = (task.CurrentProgressPercentage || 0).toFixed(1);

            if (options.progressElem) {
                options.progressElem.value = progress;

                if (task.State == 'Running') {
                    options.progressElem.classList.remove('hide');
                } else {
                    options.progressElem.classList.add('hide');
                }
            }

            if (options.lastResultElem) {
                var lastResult = task.LastExecutionResult ? task.LastExecutionResult.Status : '';

                if (lastResult == "Failed") {
                    options.lastResultElem.html('<span style="color:#FF0000;">' + Globalize.translate('LabelFailed') + '</span>');
                }
                else if (lastResult == "Cancelled") {
                    options.lastResultElem.html('<span style="color:#0026FF;">' + Globalize.translate('LabelCancelled') + '</span>');
                }
                else if (lastResult == "Aborted") {
                    options.lastResultElem.html('<span style="color:#FF0000;">' + Globalize.translate('LabelAbortedByServerShutdown') + '</span>');
                } else {
                    options.lastResultElem.html(lastResult);
                }
            }
        }

        function onScheduledTaskMessageConfirmed(instance, id) {
            ApiClient.startScheduledTask(id).then(function () {

                pollTasks(instance);
            });
        }

        function onButtonClick() {

            var button = this;
            var id = button.getAttribute('data-taskid');

            var key = 'scheduledTaskButton' + options.taskKey;
            var expectedValue = new Date().getMonth() + '5';

            if (appStorage.getItem(key) == expectedValue) {
                onScheduledTaskMessageConfirmed(button, id);
            } else {

                var msg = Globalize.translate('ConfirmMessageScheduledTaskButton');
                msg += '<br/>';
                msg += '<div style="margin-top:1em;">';
                msg += '<a class="clearLink" href="scheduledtasks.html"><paper-button style="color:#3f51b5!important;margin:0;">' + Globalize.translate('ButtonScheduledTasks') + '</paper-button></a>';
                msg += '</div>';

                require(['confirm'], function (confirm) {

                    confirm(msg, Globalize.translate('HeaderConfirmation')).then(function () {
                        appStorage.setItem(key, expectedValue);
                        onScheduledTaskMessageConfirmed(button, id);
                    });

                });
            }
        }

        function onSocketOpen() {
            startInterval();
        }

        function onSocketMessage(e, msg) {
            if (msg.MessageType == "ScheduledTasksInfo") {

                var tasks = msg.Data;

                updateTasks(self, tasks);
            }
        }

        var self = this;
        var pollInterval;

        function onPollIntervalFired() {

            if (!ApiClient.isWebSocketOpen()) {
                pollTasks(self);
            }
        }

        function startInterval() {
            if (ApiClient.isWebSocketOpen()) {
                ApiClient.sendWebSocketMessage("ScheduledTasksInfoStart", "1000,1000");
            }
            if (pollInterval) {
                clearInterval(pollInterval);
            }
            pollInterval = setInterval(onPollIntervalFired, 5000);
        }

        function stopInterval() {
            if (ApiClient.isWebSocketOpen()) {
                ApiClient.sendWebSocketMessage("ScheduledTasksInfoStop");
            }
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        }

        if (options.panel) {
            $(options.panel).hide();
        }

        if (options.mode == 'off') {

            this.off('click', onButtonClick);
            Events.off(ApiClient, 'websocketmessage', onSocketMessage);
            Events.off(ApiClient, 'websocketopen', onSocketOpen);
            stopInterval();

        } else if (this.length) {

            this.on('click', onButtonClick);

            pollTasks(self);

            startInterval();

            Events.on(ApiClient, 'websocketmessage', onSocketMessage);
            Events.on(ApiClient, 'websocketopen', onSocketOpen);
        }

        return this;
    };
});