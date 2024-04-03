exports.handler = async function() {
  const apiKey = process.env.API_KEY;
  return {
    statusCode: 200,
    body: JSON.stringify({ apiKey }),
  };
}
