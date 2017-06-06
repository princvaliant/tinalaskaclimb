import {Meteor} from 'meteor/meteor';

let clientId = '98913721242-piqnpohnb4523d4s8q17bnasncsc81hb.apps.googleusercontent.com';
let secret = 'IvOQ1bGx6D2_En4nM3U-tMHW';

ServiceConfiguration.configurations.upsert(
    {service: 'google'},
    {
        $set: {
            clientId: clientId,
            loginStyle: 'popup',
            secret: secret
        }
    }
);



Meteor.publish('posts', function tasksPublication () {
    return Posts.find();
});


Meteor.startup(() => {
    SyncedCron.start();

    SyncedCron.add({
        name: 'Subscribe to messages',
        schedule: function (parser) {
            // parser is a later.parse object
            return parser.text('every 59 seconds');
        },
        job: function () {
            listen();
        }
    });
});

let gmailClients = {};
function listen () {

    let user = exchangeRefreshToken();
    let google = user.services.google;
    delete gmailClients[user._id];
    gmailClients[user._id] = new GMail.Client({
        clientId: clientId,
        clientSecret: secret,
        accessToken: google.accessToken,
        expirationDate: google.expiresAt,
        refreshToken: google.refreshToken
    });

    gmailClients[user._id].onNewEmail('to:tinalaskaclimb@gmail.com', function (message) {
        Posts.upsert({_id: message._id}, message);
    });
}

function exchangeRefreshToken() {

    let user = Meteor.users.findOne();
    let google = user.services.google;
    let config = Accounts.loginServiceConfiguration.findOne({service: "google"});
    if (! config)
        throw new Meteor.Error(500, "Google service not configured.");

    if (!google || ! google.refreshToken)
        throw new Meteor.Error(500, "Refresh token not found.");

    let result;
    try {
        result = Meteor.http.call("POST",
            "https://accounts.google.com/o/oauth2/token",
            {
                params: {
                    'client_id': config.clientId,
                    'client_secret': config.secret,
                    'refresh_token': user.services.google.refreshToken,
                    'grant_type': 'refresh_token'
                }
            });
    } catch (e) {
        let code = e.response ? e.response.statusCode : 500;
    }

    if (result.statusCode === 200) {
        // console.log('success');
        // console.log(EJSON.stringify(result.data));

        Meteor.users.update(user._id, {
            '$set': {
                'services.google.accessToken': result.data.access_token,
                'services.google.expiresAt': (+new Date) + (1000 * result.data.expires_in),
            }
        });

        return  Meteor.users.findOne();
    } else {
        throw new Meteor.Error(result.statusCode, 'Unable to exchange google refresh token.', result);
    }
}