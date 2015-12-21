var InterviewApp = React.createClass({
	getInitialState: function() {
		return ({currentStage: 0});
	},

	nextStage: function() {
		console.log("next stage");
		this.setState({currentStage: this.state.currentStage+1});
	},

	render: function() {
		switch(this.state.currentStage){
			case 0: return (<GetStarted nextStage={this.nextStage}/>); break;
			case 1: return (<InterviewDetails nextStage={this.nextStage}/>); break;
			default: null;
		}
			
	}
});

var InterviewDetails = React.createClass({
	render: function() {
		return (
			<div>
				<section className="white minH">
				</section>
			</div>
		);
	}
});

var GetStarted = React.createClass({
	render: function() {
		return (
			<div>
				<h1 className="orange mpnew">Get Started</h1>

				<section className="white minH">
					<div className="container">
						<div className="getting_started_intro">
							<div className="half half1 text_centering">
								<img src="images/get_starting_intro.png" height="250px"/>
							</div>
							<div className="half half2 mt50">
								<p className="intro_title">Ready to smash your next coding interview?</p>
								<p className="intro_text">Lets get going!</p>
							</div>
						</div>
						<OutlineTable title={"Taking Your Interview"} content={TakingInterviewOutline} />
						<OutlineTable title={"Submitting Your Interview"} content={SubmittingInterviewOutline} />
						<div className="breaker"></div>
						<h3>Ready?</h3>
						<br />
						<div className="tc">
							<div onClick={this.props.nextStage} className="button">Lets Go</div>
						</div>
					</div>
				</section>
			</div>
		);
	}
});

var OutlineTable = React.createClass({
	render: function() {
		return (
			<div>
				<div className="breaker"></div>
				<h3>{this.props.title}</h3>
				<table className="get_started_table">
					<tbody>
						{this.props.content.map(function(entry) {
							return (
								<tr>
									<td><ul><li><span>{entry.words}</span></li></ul></td>
									<td className="tc"><img src={"images/"+entry.image} /></td>
								</tr>
							);
						}, this)}
					</tbody>
				</table>
			</div>
		);
	}
});

var TakingInterviewOutline = [
	{
		words: "Before you are asked a question on screen, a timer will appear on screen",
		image: "get_starting_intro.jpg"
	},
	{
		words: "You will have an interactive whiteboard from which to code out your answer",
		image: "get_starting_intro.jpg"
	},
	{
		words: "Make sure to have some scratch paper to plan your algorithm on!",
		image: "get_starting_intro.jpg"
	},
	{
		words: "Each question will have a maximum of 3 hints you can use at will",
		image: "get_starting_intro.jpg"
	}
];

var SubmittingInterviewOutline = [
	{
		words: "Some instructions to go here...",
		image: "get_starting_intro.jpg"
	}
]

ReactDOM.render(
  <InterviewApp />,
  document.getElementById('takeinterview')
);
