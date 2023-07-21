const Stripe = require("stripe");
const stripe = Stripe(
    "sk_test_51NQCtmLTIgFr81MdfMy6mss1a6mFhYkyrGwvy5hUjl0Rt9PVwGZXNzz0j7AZYJG5jkYSi40WlZwBOy08EZeJnguf00YDDIOyzD"
);

const createWebhook = async () => {
    const webhookEndpoint = await stripe.webhookEndpoints.create({
        url: "https://ws-event-processing.4biz.one/events/webhook/cc3ac8ad-aad9-a3f5-ecca-1047eb11b809",
        enabled_events: ["*"]
    });
    console.log(webhookEndpoint);
    console.log("we_1NVGfrLTIgFr81MdQ2o2Hnhv");
};

const teste = async () => {
    const response = await stripe.prices.update({
        active: false
    });
    console.log(response);
};

// createWebhook().then(async () => {
//     await teste();
// });

teste();
