module.exports = {
	registerAll: function() {
		require('./slang-form').register();
		require('./slang-search').register();
	}
};