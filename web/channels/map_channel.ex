defmodule TweetMap.MapChannel do
  use Phoenix.Channel
  require Logger

  def join("maps:map", _, socket) do
    {:ok, socket}
  end

  def handle_in("new_tweet", %{"query" => query}, socket) do
    pid = spawn(fn() ->
      process_tweets(socket, query) 
      process_stream(socket, query)
    end)
    # ExTwitter.stream_control(pid, :stop)
    {:noreply, socket}
  end

  def handle_out("new_tweet", payload, socket) do
    push socket, "new_tweet", payload
    {:noreply, socket}
  end

  defp prepare_tweet(tweet) do
    Logger.info tweet.text
    coordinates = tweet.coordinates.coordinates
    %{
      text: tweet.text,
      lat: List.last(coordinates),
      lng: List.first(coordinates),
      entities: tweet.entities 
    }
  end

  defp process_stream(socket, query) do
    # uncomment for insert tweets into MongoDB
    # mongo = Mongo.connect!
    # db = mongo |> Mongo.db("tweet_map")
    # tweets_collection = db |> Mongo.Db.collection("tweets")
    stream = ExTwitter.stream_filter(track: query)
    for tweet <- stream do
      # tweet |> Poison.encode! |> Poison.decode! |> Mongo.Collection.insert_one(tweets_collection)
      if !is_nil(tweet.coordinates) do
        broadcast! socket, "new_tweet", prepare_tweet(tweet)
      end
    end
  end

  defp process_tweets(socket, query) do
    tweets = ExTwitter.search(query, [count: 200])
              |> Enum.filter(fn(x) -> !is_nil(x.coordinates) end)
              |> Enum.map(fn(x) -> prepare_tweet(x) end)
              |> Enum.map(fn(x) -> broadcast! socket, "new_tweet", x end)
  end
end
