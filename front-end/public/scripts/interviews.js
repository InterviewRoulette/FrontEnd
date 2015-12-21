var Interviews = React.createClass({
	loadVideosFromServer: function() {

	},

	getInitialState: function() {
		// Spam a bunch of videos:
		for (var i=0; i < 3; i++)
			ExampleVideos = ExampleVideos.concat(ExampleVideos);

		console.log(ExampleVideos);
		return {videos: ExampleVideos}
	},

	render: function() {
		return (
			<div>
				<h1 className="skyblue mpnew">User Interviews</h1>

				<section className="white minH530">
					<div className="container">
						<InterviewList videos={this.state.videos} />
					</div>
				</section>
			</div>
		);
	}
});

var InterviewList = React.createClass({
	render: function() {
		return (
			<span>
				{this.props.videos.map(function(interview) {
					console.log(interview);
					return (
						<span>
							<IndividualInterview video={interview} />
						</span>
					);
				}, this)}
			</span>
		);
	}
});

var IndividualInterview = React.createClass({
	render: function() {
		
		var v = this.props.video;
		
		return (
			<a href={"interview.html?vid="+v.vid}>
				<div className="fourths">
					<div className="vid_box_header">{v.vid}</div>
					<div className="vid_box"></div>
					<div className="vid_box_bottom">
						<div className="vid_box_username">{v.username}</div>
						<div className="vid_box_comments">47 comments</div>
						<div className="vid_box_ratings"></div>
					</div>
				</div>
			</a>
		);
	}
});


var ExampleVideos = [
	{
		vid: "0001",
		username: "djprof",
		video_url: "www.jamesburnside.com/",
		text_url: "www.alxhill.com/",
		thumbnail: "www.samhealer.com/",
		tags: ["array", "strings"],
		language: "python",
		rating: 5.0,
		comments: 
			[
				{"djprof": "Greatest interview in all existance"},
				{"djprof": "Me again, just rewatched it, this was so good!"},
				{"jb12459": "@djprof, not too bad I guess..."}
			]
	},
	{
		vid: "0002",
		username: "djprof",
		video_url: "www.jamesburnside.com/",
		text_url: "www.alxhill.com/",
		thumbnail: "www.samhealer.com/",
		tags: ["array", "strings"],
		language: "C++",
		rating: 4.0,
		comments: 
			[
				{"djprof": "Greatest interview in all existance"},
				{"djprof": "Me again, just rewatched it, this was so good!"},
				{"jb12459": "@djprof, not too bad I guess..."}
			]
	}
];

ReactDOM.render(
  <Interviews />,
  document.getElementById('interviews')
);
