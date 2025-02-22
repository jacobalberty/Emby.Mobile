package com.mb.android.logging;

import android.content.Context;
import android.os.Environment;

import com.mb.android.api.SyncLoggerFactory;

import ch.qos.logback.classic.Level;
import mediabrowser.apiinteraction.android.sync.MediaSyncAdapter;
import mediabrowser.model.logging.ILogger;

import java.io.File;
import java.util.UUID;
import org.slf4j.LoggerFactory;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.android.LogcatAppender;
import ch.qos.logback.classic.encoder.PatternLayoutEncoder;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.FileAppender;
import mediabrowser.model.logging.NullLogger;


public class AppLogger {

    private static ILogger logger;

    public static ILogger getLogger(Context context){

        if (logger == null){
            logger = createLogger(context);
        }
        return logger;
    }

    private static boolean enableLogging() {
        return true;
    }

    public static ILogger createLogger(Context context) {

        if (!enableLogging()) {
            return new NullLogger();
        }

        org.slf4j.Logger internalLogger = configureLogbackDirectly(context);

        MediaSyncAdapter.LoggerFactory = new SyncLoggerFactory(new LogbackLogger(internalLogger, "SyncService"));

        return new LogbackLogger(internalLogger, "App");
    }

    private static org.slf4j.Logger configureLogbackDirectly(Context context) {

        // reset the default context (which may already have been initialized)
        // since we want to reconfigure it
        LoggerContext lc = (LoggerContext)LoggerFactory.getILoggerFactory();
        lc.reset();

        // setup FileAppender
        PatternLayoutEncoder encoder1 = new PatternLayoutEncoder();
        encoder1.setContext(lc);
        encoder1.setPattern("%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n");
        encoder1.start();

        FileAppender<ILoggingEvent> fileAppender = new FileAppender<ILoggingEvent>();
        fileAppender.setContext(lc);
        fileAppender.setEncoder(encoder1);
        fileAppender.setName("fileAppender");
        fileAppender.setFile(getLogFilePath(context, ""));
        fileAppender.addFilter(new LogFileFilter(false));
        fileAppender.start();

        /*LogcatAppender logcatAppender = new LogcatAppender();
        logcatAppender.setContext(lc);
        logcatAppender.setEncoder(encoder1);
        logcatAppender.setName("logcatAppender");
        logcatAppender.start();*/

        // add the newly created appenders to the root logger;
        // qualify Logger to disambiguate from org.slf4j.Logger
        ch.qos.logback.classic.Logger root = (ch.qos.logback.classic.Logger) LoggerFactory.getLogger(Logger.ROOT_LOGGER_NAME);
        root.addAppender(fileAppender);
        //root.addAppender(logcatAppender);

        return LoggerFactory.getLogger("App");
    }

    private static String getLogFilePath(Context context, String prefix){

        String filename = prefix + UUID.randomUUID().toString() + ".log";

        boolean mExternalStorageAvailable = false;
        boolean mExternalStorageWriteable = false;
        String state = Environment.getExternalStorageState();

        if (Environment.MEDIA_MOUNTED.equals(state)) {
            // We can read and write the media
            mExternalStorageAvailable = mExternalStorageWriteable = true;
        } else if (Environment.MEDIA_MOUNTED_READ_ONLY.equals(state)) {
            // We can only read the media
            mExternalStorageAvailable = true;
            mExternalStorageWriteable = false;
        } else {
            // Something else is wrong. It may be one of many other states, but all we need
            //  to know is we can neither read nor write
            mExternalStorageAvailable = mExternalStorageWriteable = false;
        }

        if (mExternalStorageAvailable && mExternalStorageWriteable){
            File directory = new File(Environment.getExternalStorageDirectory().getAbsolutePath(), "emby");
            directory = new File(directory, "logs");
            return new File(directory, filename).getPath();
        }
        else{
            return context.getFileStreamPath(filename).getAbsolutePath();
        }
    }

    public static void setDebugLoggingEnabled(boolean enabled){

        ch.qos.logback.classic.Logger root = (ch.qos.logback.classic.Logger) LoggerFactory.getLogger(Logger.ROOT_LOGGER_NAME);

        if (enabled){
            root.setLevel(Level.DEBUG);
        }
        else{
            root.setLevel(Level.INFO);
        }
    }
}