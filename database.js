/*
* Add correct bootcards css to page
*/
var is_ios = /(iPad|iPhone|iPod)/g.test( navigator.userAgent );
var is_android = (/(Android)/gi).test(navigator.userAgent);

if(is_ios){
 $('<link rel="stylesheet" type="text/css" href="./bower_components/bootcards/dist/css/bootcards-ios.css" />').appendTo("head");
}else if(is_android){
  $('<link rel="stylesheet" type="text/css" href="./bower_components/bootcards/dist/css/bootcards-android.css" />').appendTo("head");
}else{
  $('<link rel="stylesheet" type="text/css" href="./bower_components/bootcards/dist/css/bootcards-desktop.css" />').appendTo("head");
}

var settings = {
  count: 10,
  metadata: {}
};

$(document).ready(function(){
  if ($.cookie('apikey')){
    settings.apikey = $.cookie('apikey').replace(/['"]+/g, '');
  }
  //Get db from url
  settings.host = 'https://' + gup('host') + '/1.0';
  //Get host from url
  settings.db = gup('db');
  //Get List of collections
  init();
})

function init(){
  if (settings.apikey){
    $("#menu").removeClass("hidden");
    $.ajax({
      url: settings.host + '/database/' + settings.db,
      headers: { 'apikey': settings.apikey },
      success: function(response){
        settings.dbdetails = response;
        $("#apptitle").text(response.title);
      }
    });
    $.ajax({
      url: settings.host + '/collections/' + settings.db,
      headers: { 'apikey': settings.apikey },
      success: function(response){
        settings.collections = response;
        home();
      }
    });
  }else{
    buildLogin();
  }
}

function buildLogin(){
  var html = '<div class="col-sm-4 col-sm-offset-4 bootcards-cards">';
	html += '<div class="panel panel-default">';
	html += '  <div class="panel-heading clearfix">';
	html += '    <h3 class="panel-title pull-left">Login</h3>';
	html += '  </div>';
  html += '  <div class="list-group">';
  html += '    <div class="list-group-item">';
  html += '      <label class="list-group-item-text">Username</label>';
  html += '      <div class="list-group-item-heading">';
  html += '        <input type="text" id="username" name="username" class="form-control" placeholder="Username" value="">';
  html += '      </div>';
  html += '    </div>';
  html += '    <div class="list-group-item">';
  html += '      <label class="list-group-item-text">Password</label>';
  html += '      <div class="list-group-item-heading">';
  html += '        <input type="password" id="password" name="password" class="form-control" placeholder="Password" value="">';
  html += '      </div>';
  html += '    </div>';
  html += '  </div>';
  html += '  <div class="panel-footer">';
	html += '    <div class="pull-right">';
  html += '      <button class="btn btn-default" onclick="doLogin()">Submit</button>';
  html += '    </div>';
  html += '    <div id="invalidlogin" class="pull-left alert alert-danger hidden">Invalid username or password</div>';
  html += '  </div>';
  html += '</div></div>';
  $("#content").html(html);
}

function doLogin(){
  var data = {};
  data.username = $("#username").val();
  data.password = $("#password").val();
  $.ajax({
    type: "POST",
    url: settings.host + '/login',
    data: data,
    complete: function(res){
      res = JSON.parse(res.responseText);
      if (res.apikey){
        $.cookie('apikey', res.apikey);
        settings.apikey = res.apikey;
        init();
      }else{
        $("#invalidlogin").removeClass("hidden");
      }
    },
    dataType: 'application/json'
  });
}

function logout(){
  delete settings.apikey;
  $.removeCookie('apikey');
  $("#menu").addClass("hidden");
  init();
}

function home(){
  var tophtml = '';
  var html = '<div class="panel panel-default bootcards-summary">';
	html += '<div class="panel-heading">';
	html += '<h3 class="panel-title">Dashboard</h3>';
	html += '</div>';
	html += '<div class="panel-body">';
  html += '<div class="row">';
  for (var i=0; i<settings.collections.length; i++){
    html += '<div class="col-xs-6 col-sm-4">';
		html += '	<a class="bootcards-summary-item" href="#" style="padding-top:35px;" onclick="openCollection(\'' + settings.collections[i].collection + '\', 0)">';
		html +=	'	<i class="fa fa-3x fa-files-o"></i>';
		html += '	<h4>' + settings.collections[i].collection;
		html += '  <span class="label label-info">' + settings.collections[i].count + '</span>';
		html += '</h4></a></div>';

    tophtml += '<li><a href="#" onclick="openCollection(\'' + settings.collections[i].collection + '\', 0)">' + settings.collections[i].collection + '</a></li>';
  }
  html += '</div>';
  html += '</div>';
  html += '<div class="panel-footer">';
  html += '</div>';
  html += '</div>';

  $("#content").html(html);
  $("#topmenuoptions").html(tophtml);
}

function openCollection(collection, start){
  getCollectionData(collection, start, function(data){
    if (!settings.metadata[collection].defined){
      $("#warning-panel-title").text("Key Fields Not Defined");
      $("#warning-panel-body").html("<p>Key Fields are not defined for this collection.</p><p>This will make the experience of viewing data in this template less than optimal. Contact your administrator to enable key fields for all collections.</p>");
      $("#warning-panel").removeClass("hidden");
      defined = false;
    }else{
      $("#warning-panel").addClass("hidden");
    }

    var html = '<div class="row" id="collectiondata">';
    html += '<div class="col-sm-5 bootcards-list" id="list">';
    html += '<div class="panel panel-default">';
    html += '<div class="panel-heading clearfix"><h3 class="panel-title">' + collection + '</h3></div>';
    html += '<div class="list-group">';
    html += '<div class="list-group-item" id="panel-header"></div>';
    for (var i=0; i<data.data.length; i++){
      var document = data.data[i];
      var keyfield = settings.metadata[collection].keyfields[0];
      var keyfieldval = getKeyField(document, 0);
      var detailsfieldval = getKeyField(document, 1);
      if (detailsfieldval == ""){
        detailsfieldval = getKeyField(document, 2);
      }
  		html += '<a class="list-group-item" href="#" onclick="openDocument(this, \'' + collection + '\', \'' + document.__unid + '\')">';
  		html += '<h4 class="list-group-item-heading">' + keyfieldval + '</h4>';
  		html += '<p class="list-group-item-text">' + detailsfieldval + '</p>';
  		html += '</a>';
    }

    html += '</div></div></div>';
    html += '<div class="col-sm-7 bootcards-cards hidden-xs" id="listDetails">';
    html += '</div></div>';
    $("#content").html(html);

    $('#panel-header').bootpag({
        total: Math.ceil(data.count / settings.count),
        page: (start / settings.count) + 1,
        maxVisible: 5
      }).on('page', function(event, num) {
        openCollection(collection, (num - 1) * settings.count);
      });
  })
}

function getKeyField(document, index){
  var keyfield = settings.metadata[document.__form].keyfields[index];
  var val = document[keyfield.fieldname];
  if (!val){
    return "";
  }
  if (keyfield.fieldtype == "Date"){
    return moment(val).format("DD MMMM YYYY HH:mm");
  }else{
    return parseField(val);
  }
}

function parseField(val){
  if (typeof(val) == 'object') {
    if (val.type == 'richtext') {
      val = val.data;
    } else if (val.type == 'multipart') {
      try{
        for (var ipart = 0; ipart < val.content.length; ipart++) {
          if (val.content[ipart].contentType.indexOf('text/plain') > -1) {
            document[keyfield.fieldname] = val.content[ipart].data;
            val = document[keyfield.fieldname].replace(/=\r\n/g, "");
          }
        }
      }catch(e){
        val = document[keyfield.fieldname + "__parsed"].replace(/(<([^>]+)>)/ig,"");
      }
    }
    if (Array.isArray(val)) {
      val = val.join(", ");
    }
  }
  return val;
}

function openDocument(element, collection, unid){
  $(".list-group-item").removeClass("active");
  $(element).addClass("active");

  $.ajax({
    url: settings.host + '/document/' + settings.db + '/' + collection + '/' + unid,
    headers: { 'apikey': settings.apikey },
    success: function(response){
      var html = '<div class="panel panel-default">';
      html += '<div class="panel-heading clearfix">';
      html += '<h3 class="panel-title pull-left">Document</h3>';
      html += '</div>';
      html += '<div class="list-group">';

      var keyfields = settings.metadata[collection].keyfields;
      for (var i=0; i<keyfields.length; i++){
        if (response[keyfields[i].fieldname]){
          html += '<div class="list-group-item">';
          var label = keyfields[i].fieldlabel;
          if (label == ""){
            label = keyfields[i].fieldname;
          }
          html += '<label>' + label + '</label>';
          if (keyfields[i].fieldname == "_files"){
            html += '<h4 class="list-group-item-heading">';
            var files = response[keyfields[i].fieldname];
            if (files){
              for (var ifile=0; ifile<files.length; ifile++){
                if (ifile > 0){
                  html += '<br />';
                }
                html += '<a href="' + settings.host + '/attachment/' + settings.db + '/' + collection + '/' + unid + '/' + files[ifile] + '?apikey=' + settings.apikey + '" target="_blank">' + files[ifile] + '</a>';
              }
            }else{
              html += "No Files Found";
            }
            html += '</h4>';
          }else{
            html += '<h4 class="list-group-item-heading">';
            if (keyfields[i].fieldtype == "Date"){
              html += moment(response[keyfields[i].fieldname]).format("DD MMMM YYYY HH:mm");
            }else{
              html += parseField(response[keyfields[i].fieldname]);
            }
            html += '</h4>';
          }
          html += '</div>';
        }
      }
      html += '</div>';
      html += '<div class="panel-footer">';
      html += '</div>';
      html += '</div>';
      $("#listDetails").html(html);
    }
  });
}

function getMetaData(collection, callback){
  $.ajax({
    url: settings.host + '/metadata/' + settings.db + '/' + collection,
    headers: { 'apikey': settings.apikey },
    success: function(response){
      response.fields = response.fields.sort(function compare(a,b) {
        if (a.position < b.position)
           return -1;
        if (a.position > b.position)
          return 1;
        return 0;
      });
      //Extract KeyFields
      var keyfields = [];
      var nonkeyfields = [];
      for (var i=0; i<response.fields.length; i++){
        if (response.fields[i].keyfield){
          keyfields.push(response.fields[i]);
        }else{
          nonkeyfields.push(response.fields[i]);
        }
      }
      var defined = true;
      if (keyfields.length == 0){
        keyfields = nonkeyfields;
        nonkeyfields = [];
        defined = false;
      }
      settings.metadata[collection] = {keyfields: keyfields, nonkeyfields: nonkeyfields, defined: defined};

      callback();
    }
  });
}

function getCollectionData(collection, start, callback){
  $.ajax({
    url: settings.host + '/collections/' + settings.db + '/' + collection + '?start=' + start + '&count=' + settings.count,
    headers: { 'apikey': settings.apikey },
    success: function(response){
      if (!settings.metadata[collection]){
        getMetaData(collection, function(){
          callback(response);
        })
      }else{
        callback(response);
      }
    }
  });
}

function gup(name) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.href);
  if (results == null)
    return "";
  else
    return results[1];
}
