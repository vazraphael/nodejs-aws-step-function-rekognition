if (!process.env.DB_HOST) {
	require('dotenv/config');
}
const SqlString = require('mysql/lib/protocol/SqlString');
const database = require('serverless-mysql')({
	config: {
		host: process.env.DB_HOST,
		database: process.env.DB_NAME,
		user: process.env.DB_USER,
		password: process.env.DB_PASS,
		// timezone: '+UTC',
		queryFormat: function (sql, values, timeZone) {
			sql = SqlString.format(sql, values, false, timeZone);
			sql = sql.replace(/'NOW\(\)'/g, 'NOW()');
			sql = sql.replace(/'UNIX_TIMESTAMP\(\)'/g, 'UNIX_TIMESTAMP()'); // if you want
			return sql;
		},
		typeCast: function castField(field, useDefaultTypeCasting) {
			if (field.type === "BIT" && field.length === 1) {
				var bytes = field.buffer();
				return bytes ? bytes[0] == 1 ? 1 : 0 : 0;
			}
			if (field.type === "JSON") {
				return JSON.parse(field.string());
			}
			return useDefaultTypeCasting();
		}
	},
});
module.exports = database;
