const bcrypt = require('bcrypt');

const userService = require('../services/user');
const statusCode = require('../constants/statusCode');
const logger = require('../modules/logger');

const { doesSuchUserExist } = require('../services/validations/user');
const { getUserById } = require('../services/user');

module.exports = {

  login: (params) => {
    return new Promise((resolve, reject) => {
      const { email, password } = params;

      doesSuchUserExist(email)
        .then(result => {
          if (result) {
            result = result.dataValues;
            bcrypt.compare(password, result.password).then((res) => {
              if (res) {
                return resolve([
                  {
                    id: result.id,
                    mobile: result.mobile,
                    firstName: result.firstName,
                    email: result.email,
                    profilePic: result.profilePic
                  },
                  statusCode.OK
                ]);
              } else {
                return reject([
                  'Wrong password', statusCode.UNAUTHORIZED
                ]);
              }
            });
          } else { 
            return reject([
              'No such user exists', statusCode.UNAUTHORIZED
            ]);           
          }
        }).catch(err => {
          logger.error(
            'controller doesSuchUserExist login:', err
          );
          return reject([
            'Server side error', statusCode.INTERNAL_SERVER_ERROR
          ]);
        });
    });
  },

  signup: (params) => {
    return new Promise((resolve, reject) => {

      doesSuchUserExist(params.email)
        .then(result => {
          if (result) {
            return reject([
              'User already exists. Try login', statusCode.BAD_REQUEST
            ]);
          } else {

            userService.createUser(params)
              .then((user) => {
                delete user.password;
                return resolve([
                  user,
                  statusCode.CREATED
                ]);
              }).catch((err) => {
                logger.error('controller createUser signup:', err);
                return reject([
                  'Server side error', statusCode.INTERNAL_SERVER_ERROR
                ]);
              });            
          }
        }).catch(err => {
          logger.error(
            'controller doesSuchUserExist signup:', err
          );
          return reject([
            'Server side error', statusCode.INTERNAL_SERVER_ERROR
          ]);
        });
    });
  },

  getUserById: (id) => {
    return getUserById(id).then(user => {
      if (!user) {
        return ['User does not exist', statusCode.NOT_FOUND];
      }

      return [user, statusCode.OK];
    }).catch(err => {
      logger.error('controller getUserById', err);
      throw (['Server side error', statusCode.INTERNAL_SERVER_ERROR]);
    });
  },

  getUser: ({ email }) => {
    return new Promise((resolve, reject) => {
      doesSuchUserExist(email)
        .then(result => {
          if (result) {
            result = result.dataValues;
            delete result.password;
            return resolve([
              result, statusCode.OK
            ]);
          } else { 
            return resolve([
              {}, statusCode.OK
            ]);           
          }
        }).catch(err => {
          logger.error(
            'controller doesSuchUserExist getUser:', err
          );
          return reject([
            'Server side error', statusCode.INTERNAL_SERVER_ERROR
          ]);
        });
    });
  },

  updateUser: (params) => {
    const { id, decodedId } = params;
    return new Promise((resolve, reject) => {
      if (id !== decodedId) {
        // You can not update other user's information
        return reject(['Not authorized', statusCode.FORBIDDEN]);
      }

      doesSuchUserExist(params.email)
        .then(result => {
          if (result) {
            userService.updateUser(params)
              .then((user) => {
                delete user.password;
                return resolve([
                  user, statusCode.OK
                ]);
              }).catch((err) => {
                logger.error(
                  'controller updateUser:', err
                );
                return reject([
                  'Server side error', statusCode.INTERNAL_SERVER_ERROR
                ]);
              });
          } else { 
            return reject([
              'No such User Exist', statusCode.BAD_REQUEST
            ]);           
          }
        }).catch(err => {
          logger.error(
            'controller doesSuchUserExist updateUser:', err
          );
          return reject([
            'Server side error', statusCode.INTERNAL_SERVER_ERROR
          ]);
        });
    });
  }
};
