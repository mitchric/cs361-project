# CS 361: Group 13 Project

## Setup
Run:
```
npm install
npm install --save-dev nodemon
npm install aws-sdk
node app.js port_number
```
Connect to OSU VPN (this is necessary for database access)

Then navigate to localhost:port_number in browser

## Deploying to heroku
- I added you each as collaborators, which I think means you can deploy to the heroku site but I'm not sure (we'll find out!)
- Make changes locally, then submit a pull request to the main repo like normal.
- Once those changes are merged, sync your local master branch with the main repo's master, again like normal.
- Make sure correct pool statement in app.js is uncommented and other is commented out.
- Then start deploy process to heroku. First, you may need to install the heroku CLI (https://devcenter.heroku.com/articles/heroku-cli)
- Then clone the app repo in your local master branch (you only need to do this once):
```
heroku git:clone -a negative-results-in-science
```
- Then deploy the new changes to heroku
```
git add .
git commit -m "Description of my change"
git push heroku master
```
- Check that your changes are on https://negative-results-in-science.herokuapp.com/

## Notes
If you want to create/reset the database tables, navigate to localhost:port_number/reset in the browser