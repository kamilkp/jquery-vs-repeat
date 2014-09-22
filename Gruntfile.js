module.exports = function(grunt){
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.initConfig({
		uglify: {
			target: {
				files: {
					'src/jquery-vs-repeat.min.js': ['src/jquery-vs-repeat.js']
				}
			}
		},
		jshint: {
			all: [
				'src/jquery-vs-repeat.js',
				'Gruntfile.js'
			]
		}
	});

	grunt.registerTask('min', 'Minify javascript source code', 'uglify');
	grunt.registerTask('default', ['jshint', 'min']);
};