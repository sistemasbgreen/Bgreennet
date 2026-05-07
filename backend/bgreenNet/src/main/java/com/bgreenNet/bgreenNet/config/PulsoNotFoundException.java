package com.bgreenNet.bgreenNet.config;

public class PulsoNotFoundException extends RuntimeException {
    
    public PulsoNotFoundException(String message) {
        super(message);
    }

    public PulsoNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}