if(localStorage.getItem('channel-id') && localStorage.getItem('user_id')){
    window.location.href = window.location.href+"channel";
}

const template = Handlebars.compile(document.querySelector('#logged_in').innerHTML);
const channel_template = Handlebars.compile(document.querySelector('#channel-layout').innerHTML);

var channels;
var channels_details;

function get_all_channels() {
    let channel_request = new XMLHttpRequest();
        channel_request.open('POST','/get-channels');

    let channel_response;

    channel_request.onload = () => {
        channel_response = JSON.parse(channel_request.responseText);
        channels = channel_response;
    };
    channel_request.send();
}

function fetch_channels(){
    const channel_request = new XMLHttpRequest();
    channel_request.open('POST','/fetch-channels');

    channel_request.onload = () =>{
        var fetched_channels = JSON.parse(channel_request.responseText);
        channels_details = fetched_channels;

        fetched_channels.forEach( (channel) =>{
            const channel_content = channel_template({'id':channel[0],'title':channel[1]});
            document.querySelector('.channel-list').innerHTML += channel_content;
        });

        document.querySelectorAll('.channel-links').forEach(channel => {
            channel.onclick = () => {
                localStorage.setItem('channel-id',channel.id);
                window.location.href = window.location.href+"channel";
            };
        });
    };
    
    const data = new FormData();
    data.append('user_id', localStorage.getItem('user_id'));
    channel_request.send(data);
};

if (localStorage.getItem('display_name')){
    let content = template({'user': localStorage.getItem('display_name')});
    document.querySelector('#user_details').innerHTML = content;
    fetch_channels();
}


document.addEventListener('DOMContentLoaded', () => {

    get_all_channels();
    
    //Sign In
    document.querySelector('#login').onsubmit = () => {

        //Initialize new request
        let request = new XMLHttpRequest();
        let username = document.querySelector('#loginUsername').value;
        let password = document.querySelector('#loginPassword').value;
        request.open('POST','/login');

        //Callback function for when request completes
        request.onload = () => {

            let user = JSON.parse(request.responseText);
            if(user.success){
                console.log("Login Successful");        
                let content = template({'user':user.user.username});
                document.querySelector('#user_details').innerHTML = content;
                document.querySelector('#closeLoginModal').click();
                console.log("Logged IN");
                localStorage.setItem('username',user.user.username);
                localStorage.setItem('user_id',user.user.id);
                localStorage.setItem('display_name',user.user.display_name);
                window.location.reload();
            }
            else{
                console.log(`${user.message}`);
            }
        };

        // Add data to send with request
        let data = new FormData();
        data.append('username', username);
        data.append('password', password);

        // Send request
        request.send(data);
        return false;

    };

    //Logout
    if (localStorage.getItem('display_name')){
        document.querySelector('#logout').onclick = () => {

            localStorage.removeItem('username');
            localStorage.removeItem('display_name');
            localStorage.removeItem('user_id');
            localStorage.removeItem('channel-id');

            //Initialize new request
            let request = new XMLHttpRequest();
            request.open('POST','/logout');
            request.onload = () =>{
                console.log("Logged Out Successfully");
            }
            request.send();
            window.location.reload();
            return false;
        };
    }

    document.querySelector('#signupContinue').onclick = () => {
        document.querySelector('#signupModalClose').click();
    };

    //Signup
    document.querySelector('#signup').onsubmit = () => {    
        //Initialize new request
        let request = new XMLHttpRequest();
        let first_name = document.querySelector('#registerFirstName').value;
        let last_name = document.querySelector('#registerLastName').value;
        let username = document.querySelector('#registerUsername').value;
        let email = document.querySelector('#registerEmail').value;
        let display_name = document.querySelector('#registerDisplayName').value;
        let password = document.querySelector('#registerPassword').value;
        
        request.open('POST','/signup');

        //Callback function for when request completes
        request.onload = () => {

            let user = JSON.parse(request.responseText);
            if(user.success){
                console.log(`${user.message}`);
                localStorage.setItem('display_name',user.display_name);
                localStorage.setItem('user_id',user.user_id);
                window.location.reload();
            }
            else{
                alert(`${user.message}`);
                
            }
        };

        // Add data to send with request
        let data = new FormData();
        data.append('first_name', first_name);
        data.append('last_name', last_name);
        data.append('username', username);
        data.append('email', email);
        data.append('password', password);
        data.append('display_name', display_name);

        // Send request
        request.send(data);
        return false;

    };

    document.querySelector('#newChannel').onsubmit = () =>{

        let new_title = document.querySelector('#channelTitle').value;
        let valid = true;
        
        channels.forEach(channel => {
            if (new_title === channel[0])
            {
                valid = false;
                return;
            }
        });

        if (valid === true){        
            create_channel(new_title);
        }
        
        return false;        
    };

    document.querySelector('#join_channel').onsubmit = () => {

        join_channel(
            document.getElementById('channelJoinUrl').value
        );
            
        return false;
    };

});

function join_channel(url){
        
    let join_channel_request = new XMLHttpRequest();
    join_channel_request.open('POST','/channel/join');

    join_channel_request.onload = () =>{
        const response = JSON.parse(join_channel_request.responseText);
        console.log(response.success);
        if (response.success){
            console.log(url);
            localStorage.setItem('channel-id',response.channel_id);
            window.location.href = location.protocol + '//' + document.domain + ':' + location.port+'/channel';
        }
    };

    let data = new FormData();
    data.append('url',url);
    data.append('user_id', localStorage.getItem('user_id'));
    join_channel_request.send(data);
}

function create_channel(title){
    let request = new XMLHttpRequest();
    let desc = document.getElementById('channelDesc').value;
    request.open('POST','/channel/new');
    
    request.onload = () =>{
        const channel_response = JSON.parse(request.responseText);
        join_channel(channel_response.url);
    };

    let data = new FormData();
    data.append('title',title);
    data.append('desc',desc);
    data.append('user_id',localStorage.getItem('user_id'));

    request.send(data);
}
