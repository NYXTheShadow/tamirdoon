const {DataTypes} = require("sequelize");
const {sequelize} = require("../../config/db.js");
const {Image} = require('./image');
const Client = require('./client');
const ServiceStation = require('serviceStation');
const jwt = require('jsonwebtoken');
const config = require('config');
const Joi = require('joi');

const Serviceman = sequelize.define('Serviceman', {
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                min: 2,
                max: 50
            }
        },
        lastName: {
            type: DataTypes.STRING,
            validate: {
                min: 2,
                max: 50
            }
        },
        phoneNumber: {
            type: DataTypes.STRING,
            validate: {
                isPhoneNumberFormat(value) {
                    const phoneNumberRegex = /^\d{11}$/;

                    if (!phoneNumberRegex.test(value)) {
                        throw new Error('Invalid phone number format. Please use XXXX-XXX-XXXX.');
                    }
                }
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        emailIsVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        phoneNumberIsVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    },
    {
        tableName: 'servicemen',
    });

Serviceman.prototype.generateAuthToken = function () {
    return jwt.sign({
        id: this.id,
        email: this.email,
        firstName: this.name,
        lastName: this.lastName
    }, config.get('jwtPrivateKey'));
}

Image.hasOne(Serviceman);
Serviceman.belongsTo(Image);

Client.hasOne(Serviceman);
Serviceman.belongsTo(Client);

ServiceStation.hasMany(Serviceman);
Serviceman.belongsTo(ServiceStation);
Serviceman.beforeCreate(async (user) => {
    try {
        const client = await Client.create();
        user.ClientId = client.id;
    } catch (error) {
        throw new Error('Error creating client for user');
    }
});

function servicemanSignUpValidate(serviceman) {
    const schema = Joi.object({
        name: Joi.string().min(2).max(50).required(),
        lastName: Joi.string().min(2).max(50).required(),
        phoneNumber: Joi.string().pattern(/^\d{11}$/).required(),
        email: Joi.string().email().required(),
        password: Joi.string().pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%^*?&])[A-Za-z\d@$!%^*?&]{8,}$/).required()
    })
    return schema.validate(serviceman);
}

function servicemanSignInValidate(serviceman) {
    const schema = Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required()
    })
    return schema.validate(serviceman);
}

module.exports = {Serviceman, servicemanSignUpValidate, servicemanSignInValidate};