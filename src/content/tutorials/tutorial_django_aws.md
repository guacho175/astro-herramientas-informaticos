---
title: "Despliegue de Django en AWS con Debian"
description: "Guía paso a paso para montar un proyecto Django en una instancia EC2 de AWS con MySQL, Nginx y Supervisor."
slug: "django-aws-debian"
image: "/images/tutorials/aws-logo.png"
updated: "Sep 2025"
---

## Introducción

En esta guía aprenderás cómo desplegar un proyecto Django utilizando una instancia EC2 de AWS con el sistema operativo Debian. Se incluye instalación de dependencias, configuración de base de datos MySQL, entorno virtual, servidor web Nginx y manejo de procesos con Supervisor.

---

## Paso 1: Crear instancia EC2 en AWS

1. **Crear nueva instancia EC2.**
2. **Asignar nombre a la instancia.**
3. **Seleccionar imagen del sistema operativo**: Debian.
4. **Generar par de claves (descargar `.pem`)**  
   > ⚠️ Importante: guarda este archivo con cuidado. Lo necesitas para conectarte por SSH.
5. **Habilitar puertos HTTP, Django (8080) y FTP.**
6. **Editar las reglas de grupo de seguridad** y agregar:
   - Puerto `22` (SSH)
   - Puerto `80` (HTTP)
   - Puerto `8080` (Django)
   - Otros si es necesario.

---

## Paso 2: Conectarse por SSH

1. Descarga **PuTTY** desde:  
   [https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html](https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html)
2. Usa la IP pública de la instancia.
3. Configura el par de claves en PuTTY.
4. Usuario de acceso: `admin`.

---

## Paso 3: Instalar dependencias

```bash
sudo su
sudo apt update
sudo apt install build-essential python3-dev python3-pip python3-venv nginx supervisor postgresql libpq5 libpq-dev
```

- Verifica estado de servicios:

```bash
sudo systemctl status nginx
sudo systemctl status supervisor
```

- Instala MariaDB:

```bash
sudo apt install mariadb-server -y
sudo systemctl status mariadb
sudo systemctl enable mariadb
```

---

## Paso 4: Crear entorno de proyecto Django

```bash
mkdir penka
cd penka
python3 -m venv venv
source venv/bin/activate
pip install django
```

---

## Paso 5: Configurar base de datos MySQL

1. **Asegurar instalación:**

```bash
sudo mysql_secure_installation
```

2. **Ingresar a MySQL y crear base de datos y usuario:**

```sql
CREATE DATABASE PNK CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE USER 'usuario'@'localhost' IDENTIFIED BY 'P4SSW0RD';
GRANT ALL PRIVILEGES ON PNK.* TO 'usuario'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

3. **Instalar cliente de MySQL en Python:**

```bash
pip install mysqlclient
sudo apt install default-libmysqlclient-dev build-essential -y
```

---

## Paso 6: Crear y configurar proyecto Django

```bash
django-admin startproject testapp .
```

- Generar clave secreta:

```bash
python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

- Edita `testapp/settings.py`:

```python
import os
import pymysql
pymysql.install_as_MySQLdb()

SECRET_KEY = 'TU_CLAVE_GENERADA'

ALLOWED_HOSTS = ['127.0.0.1', 'TU_IP_PUBLICA_AWS', 'first-django.dev']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'PNK',
        'USER': 'usuario',
        'PASSWORD': 'P4SSW0RD',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}

STATIC_ROOT = os.path.join(BASE_DIR, "static/")
```

---

## Paso 7: Migrar base de datos y archivos estáticos

```bash
python3 manage.py makemigrations
python3 manage.py migrate
python3 manage.py collectstatic
```

---

## Paso 8: Crear superusuario y ejecutar servidor

```bash
python3 manage.py createsuperuser
python3 manage.py runserver 0.0.0.0:8080
```

---

## Conclusión

Ahora tienes tu proyecto Django corriendo en una instancia EC2 con acceso remoto, base de datos MySQL y servicios clave configurados. Para producción, se recomienda configurar Nginx como proxy inverso, usar Gunicorn y asegurar tu instancia con HTTPS y backups automáticos.

---
