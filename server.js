const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// Serve only the static files form the dist directory
app.use(express.static(__dirname + '/public'));


app.listen(port, () => {
  console.log('Server is up on port ' + port);
});
