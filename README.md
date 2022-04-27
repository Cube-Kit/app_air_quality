
# Documentation

## App config

Environment variables can be specified in the .env-file in the src directory.
These are parsed when the app is started and used to configure or customize the app. Below the default values are provided for each variable.

### Environment config

The environment of the node deployment (production or development) can be set with:

```text
NODE_ENV = 'development' # Can also be 'production'
```

See the [express documentation](http://expressjs.com/en/advanced/best-practice-performance.html#set-node_env-to-production)

If the node environment is set to *production* the send content security policy header forces all http requests from
the server frontend to be upgraded to https. If it is set *development* this is not done.

### Express config

The express package can be customized with the following variables:

```text
PORT = '3000'
```

The secret for express-session can also provided, which is used to sign the
session cookies. See the [express-session documentation](https://github.com/expressjs/session#readme)

```text
SESSION_SECRET = 'secret'
```

### Database config

The node-postgres package connects to the database through these variables:

```text
PGHOST = 'localhost'
PGUSER = postgres
PGPASSWORD = pw
PGDATABASE = postgres
PGPORT = 5432
```

See the [postgresql documentation](https://www.postgresql.org/docs/9.1/libpq-envars.html)

### MQTT config

Connection to the MQTT server is established though these variables:

```text
MQTTURL = 'test.mosquitto.org'
MQTTPORT = 1883
```
