# Guía de usuario — Ejecutar Stratum con Docker

Esta guía explica cómo levantar y usar Stratum en un contenedor Docker, sin necesidad de instalar Node.js. Para el detalle técnico, ver la [Guía técnica](./09-guia-tecnica-docker.md).

## ¿Qué necesito?

- Docker y Docker Compose instalados.
- Los archivos del certificado en la carpeta `ssl/` del proyecto:
  `wildcard.umdc-qa.tst.crt` y `wildcard.umdc-qa.tst.key`.
- Que el nombre `stratum.umdc-qa.tst` apunte a la máquina donde corre Docker (DNS o archivo `hosts`).
- El `nginx` de PRX (contenedor `umdc-nginx`) en ejecución: es quien atiende el puerto 443.

## Primer arranque

1. Crear la red compartida (solo la primera vez en la máquina):
   ```bash
   docker network create --driver bridge --subnet 172.22.0.0/16 --gateway 172.22.0.1 nginx_umdc-net
   ```
2. Crear un archivo `.env` junto a `docker-compose.yml` con la dirección del Redis en la nube (obligatorio) y, si hace falta, la del API backbone:
   ```
   REDIS_URL=rediss://:clave@<host-redis>:6380
   BACKBONE_BASE_URL=https://backbone.umdc-qa.tst:8084
   ```
3. Construir y arrancar:
   ```bash
   docker compose up -d --build
   ```
4. Esperar a que el estado sea `healthy`:
   ```bash
   docker compose ps
   ```

## Entrar a la aplicación

Abrir en el navegador: **https://stratum.umdc-qa.tst**

Se mostrará la pantalla de inicio de sesión; ingrese con su alias o correo y su contraseña. Si el navegador advierte sobre el certificado, el certificado de la organización no está instalado como confiable en su equipo: contacte a soporte.

## Tareas comunes

| Quiero… | Comando |
|---|---|
| Ver si está funcionando | `docker compose ps` |
| Ver los mensajes del sistema | `docker compose logs -f stratum` |
| Reiniciar la aplicación | `docker compose restart stratum` |
| Detenerla | `docker compose down` |
| Actualizar a una versión nueva | `docker compose up -d --build` |

> Las sesiones se guardan en el Redis en la nube, por lo que reiniciar Stratum no cierra las sesiones activas (si Redis no responde, se pierden al reiniciar).

## Problemas frecuentes

- **No abre la página:** confirme que `docker compose ps` muestra `stratum` como `healthy` y que el nombre `stratum.umdc-qa.tst` resuelve a la máquina correcta.
- **Error 502 al abrir la página:** reinicie `umdc-nginx` (`docker restart umdc-nginx`) y confirme que Stratum está `healthy`.
- **Inicia sesión pero no cargan datos:** el servicio de backbone no es alcanzable; avise al equipo técnico (ver sección *Solución de problemas* de la guía técnica).
