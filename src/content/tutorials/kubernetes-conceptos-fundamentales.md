---
title: "Kubernetes: Guía Completa de Pods, Deployments e Ingress"
description: "Aprende los conceptos clave de arquitectura en Kubernetes (k8s): Pods, ReplicaSets, Services, ConfigMaps e Ingress Controllers."
slug: "kubernetes-conceptos-fundamentales"
image: "https://upload.wikimedia.org/wikipedia/commons/3/39/Kubernetes_logo_without_workmark.svg"
updated: "Jul 2026"
---

## Arquitectura de Kubernetes

**Kubernetes** es la plataforma estándar de la industria para orquestar contenedores a gran escala, permitiendo auto-scaling, auto-healing (reinicios automáticos en fallas) y despliegues sin tiempo de inactividad (*zero-downtime deployments*).

![Kubernetes Logo](https://upload.wikimedia.org/wikipedia/commons/3/39/Kubernetes_logo_without_workmark.svg)

---

## 1. El Objeto Básico: Pod

Un **Pod** representa la unidad mínima ejecutable en Kubernetes. Puede contener uno o más contenedores estrechamente acoplados que comparten red y almacenamiento.

---

## 2. Definición de un `Deployment`

Un *Deployment* gestiona la creación y actualización de Pods mediante *ReplicaSets*:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orbynex-web-deployment
  namespace: production
  labels:
    app.kubernetes.io/name: orbynex-web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: orbynex-web
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: orbynex-web
    spec:
      containers:
      - name: web-app
        image: ghcr.io/guacho175/herramientastic:v2.1.0
        ports:
        - containerPort: 4321
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        readinessProbe:
          httpGet:
            path: /
            port: 4321
          initialDelaySeconds: 5
          periodSeconds: 10
```

---

## 3. Exposición Externa con `Service` e `Ingress`

### Service (ClusterIP)
Provee balanceo de carga interno entre los Pods:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: orbynex-web-service
  namespace: production
spec:
  type: ClusterIP
  selector:
    app: orbynex-web
  ports:
  - port: 80
    targetPort: 4321
```

### Ingress Controller (Enrutamiento HTTP/HTTPS)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: orbynex-web-ingress
  namespace: production
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - herramientas.orbynexdigital.cl
    secretName: orbynex-web-tls
  rules:
  - host: herramientas.orbynexdigital.cl
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: orbynex-web-service
            port:
              number: 80
```

---

## Comandos Esenciales de Diagnóstico con `kubectl`

```bash
# Ver estado de los pods en un namespace
kubectl get pods -n production -o wide

# Inspeccionar logs en vivo de una réplica
kubectl logs -n production -l app=orbynex-web --tail=100 -f

# Ejecutar una terminal interactiva dentro de un Pod
kubectl exec -it -n production deployment/orbynex-web-deployment -- /bin/sh
```

---

## Conclusión

Con Kubernetes, la infraestructura se convierte en código declarativo (IaC), permitiendo entornos resilientes y altamente disponibles en cualquier nube pública o privada.
