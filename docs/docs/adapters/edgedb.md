---
id: edgedb
title: EdgeDB
---

# EdgeDB

To use this Adapter, you need to install `edgedb`, `@edgedb/generate`, and the separate `@next-auth/edgedb-adapter` package:

```bash npm2yarn2pnpm
npm install next-auth edgedb @next-auth/edgedb-adapter
npm install @edgedb/generate --save-dev
```

## Installation

First, ensure you have the EdgeDB CLI installed. Refer to the [official EdgeDB docs](https://www.edgedb.com/install) if you encounter problems.


### Linux or macOS
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.edgedb.com | sh
```

### Windows
```powershell
iwr https://ps1.edgedb.com -useb | iex
```

Check that the CLI is available with the `edgedb --version` command. If you get a `Command not found` error, you may need to open a new terminal window before the `edgedb` command is available.

Once the CLI is installed, initialize a project from the application’s root directory. You’ll be presented with a series of prompts.

```bash
edgedb project init
```

This process will spin up an EdgeDB instance and [“link”](https://www.edgedb.com/docs/cli/edgedb_instance/edgedb_instance_link#edgedb-instance-link) it with your current directory. As long as you’re inside that directory, CLI commands and client libraries will be able to connect to the linked instance automatically, without additional configuration.

## Setup

### NextAuth.js configuration

Configure your NextAuth.js to use the EdgeDB Adapter:

```javascript title="pages/api/auth/[...nextauth].js"
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { EdgeDBAdapter } from "@next-auth/edgedb-adapter"
import { createClient } from "edgedb"

const client = createClient()

export default NextAuth({
  adapter: EdgeDBAdapter(client),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
})
```

Schema for the EdgeDB Adapter (`@next-auth/edgedb-adapter`)

### Create the EdgeDB schema

Replace the contents of the auto-generated file in `dbscema/default.esdl` with the following:

> This schema is adapted for use in EdgeDB and based upon our main [schema](/adapters/models)

```json title="default.esdl"
module default {
    type User {
        property name -> str;
        required property email -> str {
            constraint exclusive;
        }
        property emailVerified -> datetime;
        property image -> str;
        multi link accounts := .<user[is Account];
        multi link sessions := .<user[is Session]; 
        property createdAt -> datetime {
            default := datetime_current();
        };
    }

    type Account {
       required property userId -> str;
       required property type -> str;
       required property provider -> str;
       required property providerAccountId -> str {
        constraint exclusive;
       };
       property refresh_token -> str;
       property access_token -> str;
       property expires_at -> int64;
       property token_type -> str;
       property scope -> str;
       property id_token -> str;
       property session_state -> str;
       link user -> User {
            on target delete delete source;
       };
       property createdAt -> datetime {
            default := datetime_current();
        };

       constraint exclusive on ((.provider, .providerAccountId))
    }

    type Session {
        required property sessionToken -> str {
            constraint exclusive;
        }
        required property userId -> str;
        required property expires -> datetime;
        link user -> User {
            on target delete delete source;
        };
        property createdAt -> datetime {
            default := datetime_current();
        };
    }

    type VerificationToken {
        required property identifier -> str;
        required property token -> str {
            constraint exclusive;
        }
        required property expires -> datetime;
        property createdAt -> datetime {
            default := datetime_current();
        };

        constraint exclusive on ((.identifier, .token))
    }
}
```

### Migrate the database schema

Create a migration

```
edgedb migration create
```

Apply the migration

```
edgedb migrate
```

To learn more about [EdgeDB migrations](https://www.edgedb.com/docs/intro/migrations#generate-a-migration), check out the [Migrations docs](https://www.edgedb.com/docs/intro/migrations).

### Generate the query builder

```npm2yarn2pnpm
npx @edgedb/generate edgeql-js
```

This will generate the [query builder](https://www.edgedb.com/docs/clients/js/querybuilder) so that you can write fully typed EdgeQL queries with TypeScript in a code-first way.

For example

```ts
const query = e.select(e.User, () => ({
        id: true,
        email: true,
        emailVerified: true,
        name: true,
        image: true,
        filter_single: { email: 'johndoe@example.com' },
      }));

return await query.run(client);

// Return type:
// {
//     id: string;
//     email: string;
//     emailVerified: Date | null;
//     image: string | null;
//     name: string | null;
// } | null

```


## Deploying

### Deploy EdgeDB

First deploy an EdgeDB instance on your preferred cloud provider:

[AWS](https://www.edgedb.com/docs/guides/deployment/aws_aurora_ecs)

[Google Cloud](https://www.edgedb.com/docs/guides/deployment/gcp)

[Azure](https://www.edgedb.com/docs/guides/deployment/azure_flexibleserver)

[DigitalOcean](https://www.edgedb.com/docs/guides/deployment/digitalocean)

[Fly.io](https://www.edgedb.com/docs/guides/deployment/fly_io)

[Docker](https://www.edgedb.com/docs/guides/deployment/docker) (cloud-agnostic)

### Find your instance’s DSN

The DSN is also known as a connection string. It will have the format `edgedb://username:password@hostname:port`. The exact instructions for this depend on which cloud you are deploying to. 

### Set an environment variable

```env title=".env"
EDGEDB_DSN=edgedb://johndoe:supersecure@myhost.com:420
```

### Update the client

```diff title="pages/api/auth/[...nextauth].js"
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { EdgeDBAdapter } from "@next-auth/edgedb-adapter"
import { createClient } from "edgedb"

- const client = createClient()
+ const client = createClient({ dsn: process.env.EDGEDB_DSN })

export default NextAuth({
  adapter: EdgeDBAdapter(client),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
})
```



### Apply migrations

Use the DSN to apply migrations against your remote instance.

```bash
edgedb migrate --dsn <your-instance-dsn>
```

### Set up a `prebuild` script

Add the following `prebuild` script to your `package.json`. When your hosting provider initializes the build, it will trigger this script which will generate the query builder. The `npx @edgedb/generate edgeql-js` command will read the value of the `EDGEDB_DSN` environment variable, connect to the database, and generate the query builder before your hosting provider starts building the project.

```diff title="package.json"
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
+  "prebuild": "npx @edgedb/generate edgeql-js"
},
```





