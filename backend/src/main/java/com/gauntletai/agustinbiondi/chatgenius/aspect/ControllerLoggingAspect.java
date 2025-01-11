package com.gauntletai.agustinbiondi.chatgenius.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.util.Arrays;

@Slf4j
@Aspect
@Component
public class ControllerLoggingAspect {

    @Around("within(@org.springframework.web.bind.annotation.RestController *)")
    public Object logControllerMethod(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        
        String httpMethod = getHttpMethod(method);
        String path = getPath(method);
        String className = signature.getDeclaringType().getSimpleName();
        String methodName = signature.getName();
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String user = auth != null ? auth.getName() : "anonymous";
        
        log.info("Request received - User: {}, Method: {} {}, Controller: {}.{}", 
                user, httpMethod, path, className, methodName);
        
        if (log.isDebugEnabled()) {
            log.debug("Method arguments: {}", Arrays.toString(joinPoint.getArgs()));
        }
        
        long startTime = System.currentTimeMillis();
        try {
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - startTime;
            
            log.info("Request completed - User: {}, Method: {} {}, Duration: {}ms", 
                    user, httpMethod, path, duration);
            
            if (log.isDebugEnabled() && result != null) {
                log.debug("Response: {}", result);
            }
            
            return result;
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("Request failed - User: {}, Method: {} {}, Duration: {}ms, Error: {}", 
                    user, httpMethod, path, duration, e.getMessage());
            throw e;
        }
    }

    private String getHttpMethod(Method method) {
        if (method.isAnnotationPresent(GetMapping.class)) return "GET";
        if (method.isAnnotationPresent(PostMapping.class)) return "POST";
        if (method.isAnnotationPresent(PutMapping.class)) return "PUT";
        if (method.isAnnotationPresent(DeleteMapping.class)) return "DELETE";
        if (method.isAnnotationPresent(PatchMapping.class)) return "PATCH";
        return "UNKNOWN";
    }

    private String getPath(Method method) {
        for (Annotation annotation : method.getAnnotations()) {
            if (annotation instanceof GetMapping) {
                return getPathFromStrings(((GetMapping) annotation).value());
            } else if (annotation instanceof PostMapping) {
                return getPathFromStrings(((PostMapping) annotation).value());
            } else if (annotation instanceof PutMapping) {
                return getPathFromStrings(((PutMapping) annotation).value());
            } else if (annotation instanceof DeleteMapping) {
                return getPathFromStrings(((DeleteMapping) annotation).value());
            } else if (annotation instanceof PatchMapping) {
                return getPathFromStrings(((PatchMapping) annotation).value());
            } else if (annotation instanceof RequestMapping) {
                return getPathFromStrings(((RequestMapping) annotation).value());
            }
        }
        return "";
    }

    private String getPathFromStrings(String[] paths) {
        if (paths != null && paths.length > 0) {
            return paths[0];
        }
        return "";
    }
} 