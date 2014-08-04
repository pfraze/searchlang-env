module.exports = {
	registerAll: function() {
		require('./slang-phrase').register();
		require('./slang-search').register();
	}
};