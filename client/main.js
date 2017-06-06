import {Template} from 'meteor/templating';
import './main.html';


Template.registerHelper('formatDate', function(date) {
    return moment(date).format('MM-DD-YYYY HH:mm:ss');
});

Template.registerHelper('posth', function(str) {
    let s = str.replace('<https://www.google.com/voice/>', '');
    i = s.indexOf('To respond to this text message');
    if (i >= 0) {
        return s.substring(1, i);
    }
    i = s.indexOf('YOUR ACCOUNT');
    if (i >= 0) {
        return s.substring(1, i);
    }

    return s;
});

Template.body.helpers({
    posts() {
        return Posts.find({}, {sort: {date: -1}});
    }
});

Template.body.onCreated(function helloOnCreated() {
    Meteor.subscribe('posts');
    Meteor.setTimeout(() => {
        // Meteor.loginWithGoogle({
        //     requestOfflineToken: true,
        //     forceApprovalPrompt: true,
        //     requestPermissions: ["https://www.googleapis.com/auth/gmail.readonly"]
        // });
    }, 3000);
});

