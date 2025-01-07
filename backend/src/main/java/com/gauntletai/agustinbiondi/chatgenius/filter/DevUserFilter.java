package com.gauntletai.agustinbiondi.chatgenius.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

@Component
@Order(1)
public class DevUserFilter implements Filter {
    private static final String TEST_USER_ID = "11111111-1111-1111-1111-111111111111";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        
        // Only add test user if header is not present
        if (httpRequest.getHeader("X-User-ID") == null) {
            chain.doFilter(new CustomHeaderRequestWrapper(httpRequest), response);
        } else {
            chain.doFilter(request, response);
        }
    }

    private static class CustomHeaderRequestWrapper extends HttpServletRequestWrapper {
        private final Map<String, String> customHeaders;

        public CustomHeaderRequestWrapper(HttpServletRequest request) {
            super(request);
            this.customHeaders = new HashMap<>();
            this.customHeaders.put("X-User-ID", TEST_USER_ID);
        }

        @Override
        public String getHeader(String name) {
            String headerValue = customHeaders.get(name);
            return headerValue != null ? headerValue : super.getHeader(name);
        }

        @Override
        public Enumeration<String> getHeaderNames() {
            // Create a list of header names from the original request and our custom headers
            Map<String, String> headers = new HashMap<>();
            Enumeration<String> originalHeaders = super.getHeaderNames();
            while (originalHeaders != null && originalHeaders.hasMoreElements()) {
                String name = originalHeaders.nextElement();
                headers.put(name, super.getHeader(name));
            }
            headers.putAll(customHeaders);
            return Collections.enumeration(headers.keySet());
        }

        @Override
        public Enumeration<String> getHeaders(String name) {
            if (customHeaders.containsKey(name)) {
                return Collections.enumeration(Collections.singletonList(customHeaders.get(name)));
            }
            return super.getHeaders(name);
        }
    }
} 