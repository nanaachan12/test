const { BigQuery } = require('@google-cloud/bigquery');

const bigqueryClient = new BigQuery();
const datasetId = ''; 
const tableId = ''; 

const createUserTable = async () => {
    const options = {
        schema: [
            { name: 'googleId', type: 'STRING' },
            { name: 'email', type: 'STRING' },
            { name: 'name', type: 'STRING' },
        ],
        location: 'asia-southeast2',
    };

    await bigqueryClient.dataset(datasetId).table(tableId).create(options);
};

const saveUser = async (user) => {
    const query = `
        INSERT INTO \`${datasetId}.${tableId}\` (googleId, email, name)
        VALUES (@googleId, @email, @name)
    `;

    const options = {
        query: query,
        params: {
            googleId: user.googleId,
            email: user.email,
            name: user.name,
        },
    };

    await bigqueryClient.query(options);
};

const findUserByGoogleId = async (googleId) => {
    const query = `
        SELECT * FROM \`${datasetId}.${tableId}\`
        WHERE googleId = @googleId
    `;

    const options = {
        query: query,
        params: { googleId },
    };

    const [rows] = await bigqueryClient.query(options);
    return rows[0]; 
};

module.exports = {
    createUserTable,
    saveUser,
    findUserByGoogleId,
};