---
title: "Kubernetes: Conceptos Fundamentales y Arquitectura Pods"
description: "Comprende los bloques de construcción principales de Kubernetes: Pods, Deployments, Services e Ingress."
slug: "kubernetes-conceptos-fundamentales"
image: "https://upload.wikimedia.org/wikipedia/commons/3/39/Kubernetes_logo_without_workmark.svg"
updated: "Jul 2026"
---

## Introducción a Kubernetes (k8s)

**Kubernetes** es la plataforma de orquestación de contenedores open-source líder en la industria para automatizar el despliegue, escalado y administración de aplicaciones en la nube.

---

## 1. Definición de un `Deployment`

Un *Deployment* asegura que un número determinado de réplicas de tus contenedores estén siempre ejecutándose de forma saludable:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-backend-deployment
  labels:
    app: api-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-backend
  template:
    metadata:
      labels:
        app: api-backend
    spec:
      containers:
      - name: api-container
        image: mi-registry/api-backend:v1.0.0
        ports:
        - containerPort: 3000
```

---

## 2. Exposición mediante un `Service`

El recurso *Service* proporciona una dirección IP y balanceo de carga interno estable entre los Pods:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-backend-service
spec:
  type: ClusterIP
  selector:
    app: api-backend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
```

---

## 3. Comandos Principales de `kubectl`

```bash
# Ver estado del cluster
kubectl get nodes

# Ver pods en ejecución
kubectl get pods -w

# Inspeccionar logs de un Pod
kubectl logs -f deployment/api-backend-deployment
```

---

## Conclusión

Dominar la abstracción de Pods y Servicios en Kubernetes es fundamental para gestionar infraestructuras modernas de microservicios con auto-healing y escalado automático.
