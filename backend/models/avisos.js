'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class avisos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  avisos.init({
    titulo: DataTypes.STRING,
    descricao: DataTypes.STRING,
    categoria: DataTypes.STRING,
    prioridade: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'avisos',
  });
  return avisos;
};