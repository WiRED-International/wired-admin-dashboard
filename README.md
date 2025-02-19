# Admin Dashboard for Wired International
This is an application for accessing and viewing data from the Wired International database. Admin access is required to run this app

## To Run This App
- You must have a user account with Wired International and obtain admin access from another admin user. Super-admin status is required to be able to search the database. In the server database, run ```npm run seed``` to seed users and various other models.  Run ```npm run seed-downloads`` to seed the database with downloads. An API key for the google maps API is also required. An example .env file is included in this repository, showing the name of the environmental variable(s).
- You can start the client-only app by running: 
```bash
npm run dev
```
- to update the server repository with the latest build of this app, you must have this repository in an adjacent folder to the server repo and run: 
```bash
npm run sync
```



