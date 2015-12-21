var Interviews = React.createClass({
	loadVideosFromServer: function() {

	},

	getInitialState: function() {
		// Spam a bunch of videos:
		for (var i=0; i < 3; i++)
			ExampleVideos = ExampleVideos.concat(ExampleVideos);

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
		var stars = [];
		var i=0;
		
		// if 5 stars - display special stars - cuz they got 5 stars
		if(v.rating >= 5.0) {
			for(i=0; i<5; i++)
				stars.push(<img className="star" src="images/star_special.png" />);
		} else {
			for(i=0; i<Math.floor(v.rating); i++)
				stars.push(<img className="star" src="images/star_full.png" />);
			
			//push half star if need be
			if(v.rating - i >= 0.5)
				stars.push(<img className="star" src="images/star_half.png" />);

			for(var j=i+1; j<5; j++)
				stars.push(<img className="star" src="images/star_empty.png" />);

		}

		


		return (
			<a href={"interview.html?vid="+v.vid}>
				<div className="fourths">
					<div className="vid_box_header">{v.vid}</div>
					<div className="vid_box">
						<img className="interview_video_thumbnail" src="images/thumbnail_template.jpg" />
					</div>
					<div className="vid_box_bottom">
						<div className="vid_box_username">{v.username}</div>
						<div className="vid_box_comments">{v.comments.length} comments</div>
						<div className="vid_box_ratings">
							<span>{stars}</span>
						</div>
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
		rating: 4.7,
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
