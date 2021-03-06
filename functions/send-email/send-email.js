const sgMail = require('@sendgrid/mail')
const {
    validateEmail,
    validateLength,
    validateCaptcha,
    validateContactEmail
} = require('./validations')


exports.handler = (event, context, callback) => {
    if (!process.env.SENDGRID_KEY) {
        return callback(null, {
            statusCode: 500,
            body: 'process.env.SENDGRID_KEY must be defined'
        })
    }

    const body = JSON.parse(event.body)
    
    // Validate Captcha
    try {
        validateLength('body.g-recaptcha-response', body["g-recaptcha-response"], 256, 1024)
    } catch (e) {
        return callback(null, {
            statusCode: 403,
            body: e.message
        })
    }
    try {
        validateCaptcha(body["g-recaptcha-response"])
    } catch (e) {
        return callback(null, {
            statusCode: 403,
            body: e.message
        })
    }

    // User Data
    try {
        validateLength('body.name', body.name, 3, 50)
    } catch (e) {
        return callback(null, {
            statusCode: 403,
            body: e.message
        })
    }
    try {
        validateEmail('body.email', body.email)
    } catch (e) {
        return callback(null, {
            statusCode: 403,
            body: e.message
        })
    }
    try {
        validateLength('body.message', body.message, 3, 1000)
    } catch (e) {
        return callback(null, {
            statusCode: 403,
            body: e.message
        })
    }

    // Email settings
    try {
        validateEmail('body.contact_email', body.contact_email)
    } catch (e) {
        return callback(null, {
            statusCode: 403,
            body: e.message
        })
    }
    try {
        validateContactEmail(body.contact_email)
    } catch (e) {
        return callback(null, {
            statusCode: 403,
            body: e.message
        })
    }
    try {
        validateLength('body.template_id', body.template_id, 30, 35)
    } catch (e) {
        return callback(null, {
            statusCode: 403,
            body: e.message
        })
    }

    // Compile additional data
    var additional = [];
    for (var key in body) {
        if (body.hasOwnProperty(key) && key !== "name" && key !== "email" && key !== "message" && key !== "g-recaptcha-response" && key !== "contact_email" && key !== "template_id") {
            additional.push(key + ' = ' + body[key]);
        }
    };

    // Create message
    const msg = {
        to: body.contact_email,
        from: 'no-reply@lucacastelnuovo.nl',
        templateId: body.template_id,
        dynamic_template_data: {
            name: body.name,
            email: body.email,
            details: body.message,
            additional: additional.join('\n')
        },
    };

    // Send email
    sgMail.setApiKey(process.env.SENDGRID_KEY);
    sgMail
        .send(msg)
        .then(() => callback(null, {
            statusCode: 200,
            body: ''
        }))
        .catch(error => callback(null, {
            statusCode: 500,
            body: error.message
        }));
}
