function formatMessage(username: string, text: string) {
  return {
    username,
    text,
    time: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date()),
  };
}

export { formatMessage };
