$(document).ready(function() {

    // SideNav Button Initialization
    $(".button-collapse").sideNav();
})
var socket = io.connect(location.protocol + '//' + document.domain+ ':55837');

const message_template = Handlebars.compile(document.querySelector('#new-message').innerHTML);
const channel_template = Handlebars.compile(document.querySelector('#channel-list').innerHTML);

var channels_details;

function fetch_message() {
    const message_request = new XMLHttpRequest();
    message_request.open('POST','/fetch-messages');
    
    message_request.onload = () =>{

        const fetched_message = JSON.parse(message_request.responseText);
        document.querySelector('#chat-content').innerHTML = null;
        fetched_message.forEach( (msg) =>{
            const content = message_template({'display_name': msg[1], 'time': msg[2 ] , 'message_text':msg[0],
            'message_id': msg[3]});
            document.querySelector('#chat-content').innerHTML += content;
        }
        );
        document.querySelector('.chat-window').scrollTop = document.querySelector('.chat-window').scrollHeight;

        // X Should Delete Message
        document.querySelectorAll('.message-delete').forEach( message =>{
            message.onclick = () =>{
                message_id = message.parentElement.parentElement.parentElement.id;
                console.log(message_id);
                message_details = {'id':message_id};
                socket.emit('delete message', message_details);
            };
        });

    };    

    const data = new FormData();
    data.append('channel_id', localStorage.getItem('channel-id'));
    message_request.send(data);
};

function change_active_channel(channel_id){

    channels_details.forEach((channel) => {

        if (channel[0].toString() === channel_id){
            localStorage.setItem('channel-id',channel_id);
            fetch_message();
            document.querySelector('#channel_title').innerHTML = channel[1];
            document.title = "Flack | "+channel[1];
            if (channel[2] !== null)
                document.querySelector('#channel_description').innerHTML = channel[2];
            else
                document.querySelector('#channel_description').innerHTML = "";

            history.pushState(
                {"title": channel[1],
                "description": channel[2],
                "channel_id": channel[0]
            },"Flack | "+channel[1],+channel[0]);
        }
    });
};

function fetch_channels(){
    const channel_request = new XMLHttpRequest();
    channel_request.open('POST','/fetch-channels');

    channel_request.onload = () =>{
        var fetched_channels = JSON.parse(channel_request.responseText);
        channels_details = fetched_channels;

        fetched_channels.forEach( (channel) =>{
            const channel_content = channel_template({'id':channel[0],'title':channel[1]});
            document.querySelector('#side-nav-channels').innerHTML += channel_content;
            
            if (channel[0].toString() === localStorage.getItem('channel-id')){
                document.querySelector('#channel_title').innerHTML = channel[1];
                document.title = "Flack | "+channel[1];
                if (channel[2] !== null)
                    document.querySelector('#channel_description').innerHTML = channel[2];

                fetch_message();
                
                let url;
                if(window.location.pathname.includes('channel/')){
                    url = channel[0].toString();
                }
                else{
                    url = "channel/"+channel[0].toString();
                }

                history.replaceState(
                    {"title": channel[1],
                    "description": channel[2],
                    "channel_id": channel[0]
                },"Flack | "+channel[1],url);
            }
        });
        document.querySelectorAll('.channels').forEach(channel => {
            channel.onclick = () => {
                console.log('clicked');
                if( localStorage.getItem('channel-id') !== channel.id ){
                    change_active_channel(channel.id);
                }
            };
        });

    };
    
    const data1 = new FormData();
    data1.append('user_id', localStorage.getItem('user_id'));
    channel_request.send(data1);
};


fetch_channels();


document.addEventListener('DOMContentLoaded', () => {

    document.querySelector('.chat-window').scrollTop = document.querySelector('.chat-window').scrollHeight;

    socket.on('connect', () => {

        // Send button should send a message
        document.querySelector('#send-message').onclick = () => {
            const message_text = document.querySelector('#new-message-text').value;
            if (message_text === '')
                return false;
            else
            message_details = {'message-text': message_text, 'channel-id': localStorage.getItem('channel-id'), 
                                'display-name': localStorage.getItem('display_name'), 'user-id':localStorage.getItem('user_id') }
            socket.emit('send message', message_details);
        };
    });

    socket.on('receive message', message => {
        if (message.success===true){
            if(message.channel_id === localStorage.getItem('channel-id')){
                document.querySelector('#new-message-text').value = "";
                const date = new Date();
                let current_date = (date.getDate()<10?'0':'') + date.getDate()+"-";
                current_date += (date.getMonth()<10?'0':'') + date.getMonth()+"-" + date.getFullYear();
                const current_time = (date.getHours()<10?'0':'')+date.getHours()+":" + (date.getMinutes()<10?'0':'')+date.getMinutes();
                const current_timestamp = current_date+"  "+current_time;
                const content = message_template({'display_name': message.display_name, 'message_id': message.message_id,
                                 'time': current_timestamp , 'message_text':message.message_text});
                document.querySelector('#chat-content').innerHTML += content;
                document.querySelector('.chat-window').scrollTop = document.querySelector('.chat-window').scrollHeight;
            }
        }
    });

    socket.on('remove message', message => {
        message_block = document.getElementById(message.id.toString());
        message_block.remove();
        console.log("socket delete message");
    });

});
document.querySelector('#logout').onclick = () => {

    localStorage.removeItem('username');
    localStorage.removeItem('display_name');
    localStorage.removeItem('user_id');
    localStorage.removeItem('channel-id');

    //Initialize new request
    const request = new XMLHttpRequest();
    request.open('POST','/logout');
    request.onload = () =>{
        console.log("Logged Out Successfully");
    }
    request.send();
    window.location.href = location.protocol + '//' + document.domain + ':' + location.port+'/';
};

window.onpopstate = e =>{
    const data = e.state;
    document.title = data.title;
    document.querySelector('#channel_description').innerHTML = data.description;
    document.querySelector('#channel_title').innerHTML = data.title;
    localStorage.setItem('channel-id',data.channel_id);
    fetch_message();
}; 
