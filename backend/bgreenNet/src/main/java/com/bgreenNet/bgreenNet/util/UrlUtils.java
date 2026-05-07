package com.bgreenNet.bgreenNet.util;

public class UrlUtils {

    private static final String DOMAIN = "https://bgreennet.bgreen.com.co";
    private static final String[] OLD_HOSTS = {
        "http://45.183.247.77",
        "http://172.30.72.200",
        "https://bgreen.bgreen.com.co"
    };

    public static String sanitizeUrl(String url) {
        if (url == null || url.isEmpty()) {
            return url;
        }

        String sanitized = url;
        for (String oldHost : OLD_HOSTS) {
            if (sanitized.startsWith(oldHost)) {
                sanitized = sanitized.replace(oldHost, DOMAIN);
            }
        }
        return sanitized;
    }
}
