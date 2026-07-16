import { DataTypes } from 'sequelize';

const addColumnIfMissing = async (queryInterface, tableName, columnName, definition) => {
  let table;
  try {
    table = await queryInterface.describeTable(tableName);
  } catch (error) {
    console.warn(`Skipping schema patch for ${tableName}.${columnName}: ${error.message}`);
    return;
  }
  if (!table[columnName]) {
    console.log(`Adding missing column ${tableName}.${columnName}`);
    await queryInterface.addColumn(tableName, columnName, definition);
  }
};

export const applySchemaPatches = async (sequelize) => {
  const queryInterface = sequelize.getQueryInterface();

  await addColumnIfMissing(queryInterface, 'plan_members', 'invited_phone', {
    type: DataTypes.STRING(30),
    allowNull: true
  });

  await addColumnIfMissing(queryInterface, 'plan_messages', 'delivered_to', {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  });

  await addColumnIfMissing(queryInterface, 'plan_messages', 'read_by', {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  });

  await addColumnIfMissing(queryInterface, 'deposits', 'expected_date', {
    type: DataTypes.DATEONLY,
    allowNull: true
  });
};
