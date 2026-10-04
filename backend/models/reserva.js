'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class reserva extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  reserva.init({
    horario: DataTypes.INTEGER,
    data_entrada: DataTypes.STRING,
    data_saida: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'reserva',
  });
  return reserva;
};