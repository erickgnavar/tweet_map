// NOTE: The contents of this file will only be executed if
// you uncomment its entry in "web/static/js/app.js".

// To use Phoenix channels, the first step is to import Socket
// and connect at the socket path in "lib/my_app/endpoint.ex":
import {Socket} from "deps/phoenix/web/static/js/phoenix"

let socket = new Socket("/socket")

// When you connect, you'll often need to authenticate the client.
// For example, imagine you have an authentication plug, `MyAuth`,
// which authenticates the session and assigns a `:current_user`.
// If the current user exists you can assign the user's token in
// the connection for use in the layout.
//
// In your "web/router.ex":
//
//     pipeline :browser do
//       ...
//       plug MyAuth
//       plug :put_user_token
//     end
//
//     defp put_user_token(conn, _) do
//       if current_user = conn.assigns[:current_user] do
//         token = Phoenix.Token.sign(conn, "user socket", current_user.id)
//         assign(conn, :user_token, token)
//       else
//         conn
//       end
//     end
//
// Now you need to pass this token to JavaScript. You can do so
// inside a script tag in "web/templates/layout/app.html.eex":
//
//     <script>window.userToken = "<%= assigns[:user_token] %>";</script>
//
// You will need to verify the user token in the "connect/2" function
// in "web/channels/user_socket.ex":
//
//     def connect(%{"token" => token}, socket) do
//       # max_age: 1209600 is equivalent to two weeks in seconds
//       case Phoenix.Token.verify(socket, "user socket", token, max_age: 1209600) do
//         {:ok, user_id} ->
//           {:ok, assign(socket, :user, user_id)}
//         {:error, reason} ->
//           :error
//       end
//     end
//
// Finally, pass the token on connect as below. Or remove it
// from connect if you don't care about authentication.
import map from './app'

socket.connect({token: window.userToken})

let queryInput = document.querySelector('#query-input')
let queryForm = document.querySelector('#query-form')

let channel = socket.channel("maps:map", {})

channel.join()
  .receive('ok', resp => {
    console.log('Joined succesffuly', resp) 
  })
  .receive('error', resp => { console.log('Unabled to join', resp) })

queryForm.addEventListener('submit', event => {
  event.preventDefault()
  channel.push('new_tweet', {
    query: queryInput.value 
  })
})

channel.on('new_tweet', tweet => {
  let media = tweet.entities.media || []
  let urls = media.map(m => m.media_url)
  let imgs = urls.map(u => `<img src="${u}" style="max-width: 250px"/>`)
  let imgsMarkup = imgs.join('')
  map.addMarker({
    lat: tweet.lat,
    lng: tweet.lng,
    title: tweet.text,
    infoWindow: {
      content: `<h4>${tweet.text}</h4>${imgsMarkup}`
    }
  })
})

export default socket
