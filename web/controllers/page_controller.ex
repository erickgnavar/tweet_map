defmodule TweetMap.PageController do
  use TweetMap.Web, :controller

  def index(conn, _params) do
    render conn, "index.html"
  end
end
