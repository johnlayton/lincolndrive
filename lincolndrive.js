var request = require( 'request' );

var username = process.argv[2];
var password = process.argv[3];

var baseurl = 'http://' + username + ':' + password + '@<your.jenkins.box>';

var url = baseurl + '/api/json';

var model = { total : 0 };
request( url, { json: true }, function ( err, res, json ) {
  var jobs = json.jobs;
  for ( var i = 0, len = jobs.length; i < len; i++ ) {
    if ( jobs[i].name.match(/Package/) ) {
      var urls = [ baseurl + '/view/All/job/' + jobs[i].name + '/lastCompletedBuild/testReport/api/json',
                   baseurl + '/view/All/job/' + jobs[i].name + '/lastCompletedBuild/testngreports/api/json' ];

      for ( var j = 0, l2 = urls.length; j < l2; j++ ) {
        request( urls[j], {json : true}, function ( err, res, json ) {
          if ( json.total || json.passCount ) {
            console.log( this.name );
            model[this.name] = {
              duration : json.duration,
              passCount : json.passCount || json.total,
              failCount : json.failCount,
              skipCount : json.skipCount
            };
            model['total'] = model['total'] + model[this.name].passCount;
            request.post( {
              url : 'https://hooks.slack.com/services/<your.slack.hook>',
              form : { payload : JSON.stringify( {
                 channel    : "@",
                 username   : "jlayton",
                 text       : this.name + "->" + model[this.name].passCount,
                 icon_emoji : ":ghost:"
               }) } }, function( err, res, body ) { console.log(err); console.log( body )} );
          }
        }.bind( { name: jobs[i].name } ) );
      }
    }
  }
} );

var repl = require( 'repl' ).start( {
  prompt : " -> ",
  input  : process.stdin,
  output : process.stdout
} );
repl.context.model = model;
repl.context.message = function( message ) {
  request.post( {
  url : 'https://hooks.slack.com/services/<your.slack.hook>',
  form : { payload : JSON.stringify( {
    channel    : "@",
    username   : "jlayton",
    text       : message,
    icon_emoji : ":ghost:"
  }) } }, function( err, res, body ) { console.log(err); console.log( body )} );
};
