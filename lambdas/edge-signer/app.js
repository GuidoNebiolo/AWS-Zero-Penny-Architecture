const { SignatureV4 } = require('@aws-sdk/signature-v4')
const { Sha256 } = require('@aws-crypto/sha256-js')

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN } = process.env;

const sigv4 = new SignatureV4({
    service: 'lambda',
    region: 'us-east-1',
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
        sessionToken: AWS_SESSION_TOKEN,
    },
    sha256: Sha256,
});

exports.lambdaHandler = async (event, context) => {

    console.log(JSON.stringify(event))

    const request = event.Records[0].cf.request

    console.log(JSON.stringify(request))

    let body = null

    try {
        body = Buffer.from(request.body.data, 'base64').toString()
        console.log(body)
    } catch (error) {
        console.error(error)
    }

    const signature = await sigv4.sign({
        method: request.method,
        hostname: request.origin.custom.domainName,
        path: request.uri,
        protocol: request.origin.custom.protocol,
        headers: Object.assign({}, request.origin.custom.customHeaders, {
            host: request.origin.custom.domainName
        }),
        body,
    })

    for (const header in signature.headers) {
        request.headers[header.toLowerCase()] = [{
            key: header,
            value: signature.headers[header].toString()
        }]
    }

    return request
}
