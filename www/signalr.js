const axiosConfig = {
  withCredentials: true
};

const hubName = 'notify';
const maxLogs = 20;

const app = new Vue({
  el: '#app',

  data: function () {
    return {
      authenticated: false,
      isLocalhost: /\/\/localhost/.test(apiBaseUrl),
      username: '',
      newMessage: '',
      messages: [],
      ready: false,
      loginUrl: `${apiBaseUrl}/.auth/login/${authProvider}?post_login_redirect_url=${encodeURIComponent(window.location.href)}`,
      logoutUrl: `${apiBaseUrl}/.auth/logout?post_logout_redirect_uri=${encodeURIComponent(window.location.href)}`
    };
  },

  mounted: function() {
    return this.getAuthInfo().then(function () {
      if (this.isLocalhost || this.authenticated) {
        const connection = new signalR.HubConnectionBuilder()
          .withUrl(`${apiBaseUrl}/api`)
          .build();

        connection.on('newMessage', onNewMessage.bind(this));
        connection.onclose(() => console.log('disconnected'));

        document.body.classList.add('ready');  

        console.log('connecting...');
        connection.start()
          .then(() => this.ready = true)
          .catch(console.error);
      }

      let counter = 0;
      function onNewMessage(message) {
          console.log(JSON.stringify(message));
          let msg = message;                                   
          var row = eventlog.insertRow(1);
          var ts = new Date().toLocaleTimeString();
             
          row.insertCell(0).innerText =  ts;
          row.insertCell(1).innerText =  msg.location;
          row.insertCell(2).innerText =  msg.vote;
          row.insertCell(3).innerText =  Math.round(msg.humidity);
          row.insertCell(4).innerText =  Math.round(msg.temperature);
          
           if(eventlog.rows.length > maxLogs)
              eventlog.deleteRow(maxLogs)                
          
          data.labels.push(ts);
          data.datasets[0].data.push(Math.round(msg.temperature));
          data.datasets[1].data.push(Math.round(msg.humidity));
          data.datasets[2].data.push(Math.round(msg.vote*100));

          chart.update();
      }

    }.bind(this));
  },

  methods: { 
    login: function () {
      window.location.href = this.loginUrl;
    },

    logout: function () {
      window.location.href = this.logoutUrl;
    },      

    sendMessage: function(sender, recipient, messageText) {
      return axios.post(`${apiBaseUrl}/api/messages`, {
        recipient: recipient,
        sender: sender,
        text: messageText
      }, axiosConfig).then(resp => resp.data);
    },

    getAuthInfo: function () {
      return axios.post(`${apiBaseUrl}/.auth/me`, null, axiosConfig)
        .then(() => this.authenticated = true, () => null);
    }
  }

});