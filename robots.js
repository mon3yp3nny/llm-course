// Robots tab: a gripper that carries out one hand-written sequence of actions,
// to show what a robot's model outputs. Uses $ and svgNode from app.js.

const SCENE = { width: 600, height: 240, table: 200, blockSize: 30, bowlX: 440, bowlWidth: 70 };
const GRIPPER = { restY: 60, graspY: SCENE.table - SCENE.blockSize, halfOpen: 24, halfClosed: 15, fingerLength: 24 };
const BLOCK_START_X = 180;

// Each action is what the model outputs at one moment: a small movement and a
// command for the gripper. Written by hand; a real model produces dozens a second.
const ROBOT_ACTIONS = [
  { x: 100, y: GRIPPER.restY, closed: false, output: '(nothing yet)', note: 'The camera picture and the instruction go in: "Put the block in the bowl."' },
  { x: BLOCK_START_X, y: GRIPPER.restY, closed: false, output: 'move right 80, gripper open', note: 'The model sees the block to the right and moves over it.' },
  { x: BLOCK_START_X, y: GRIPPER.graspY, closed: false, output: 'move down 110, gripper open', note: 'It lowers the open gripper around the block.' },
  { x: BLOCK_START_X, y: GRIPPER.graspY, closed: true, output: 'stay, gripper close', note: 'It closes the gripper. From here on the block moves with it.' },
  { x: BLOCK_START_X, y: GRIPPER.restY, closed: true, output: 'move up 110, gripper closed', note: 'It lifts the block clear of the table.' },
  { x: SCENE.bowlX, y: GRIPPER.restY, closed: true, output: 'move right 260, gripper closed', note: 'It carries the block over to the bowl.' },
  { x: SCENE.bowlX, y: GRIPPER.graspY, closed: true, output: 'move down 110, gripper closed', note: 'It lowers the block into the bowl.' },
  { x: SCENE.bowlX, y: GRIPPER.graspY, closed: false, output: 'stay, gripper open', note: 'It lets go. The block stays where it is.' },
  { x: SCENE.bowlX, y: GRIPPER.restY, closed: false, output: 'move up 110, gripper open', note: 'It moves away. The task is done.' },
];

const robot = { step: 0 };

// Where the block is after a given step: with the gripper while held, else where it was left.
function blockPosition(step) {
  let position = { x: BLOCK_START_X, y: GRIPPER.graspY };
  let held = false;
  for (const action of ROBOT_ACTIONS.slice(0, step + 1)) {
    held = action.closed && (held || (action.x === position.x && action.y === position.y));
    if (held) position = { x: action.x, y: action.y };
  }
  return position;
}

function renderRobot() {
  const { x, y, closed, output, note } = ROBOT_ACTIONS[robot.step];
  const half = closed ? GRIPPER.halfClosed : GRIPPER.halfOpen;
  const block = blockPosition(robot.step);
  const { table, blockSize, bowlX, bowlWidth, width } = SCENE;

  $('robot-scene').replaceChildren(
    svgNode('line', { class: 'table', x1: 20, x2: width - 20, y1: table, y2: table }),
    svgNode('path', { class: 'bowl', d: `M${bowlX - bowlWidth / 2} ${table - 14} v14 h${bowlWidth} v-14` }),
    svgNode('text', { x: bowlX, y: table + 18, 'text-anchor': 'middle' }, 'bowl'),
    svgNode('rect', { class: 'block', x: block.x - blockSize / 2, y: block.y, width: blockSize, height: blockSize, rx: 3 }),
    // The arm from above, the bar of the gripper, and its two fingers.
    svgNode('line', { class: 'arm', x1: x, x2: x, y1: 0, y2: y - 6 }),
    svgNode('line', { class: 'arm', x1: x - half, x2: x + half, y1: y - 6, y2: y - 6 }),
    svgNode('line', { class: 'arm', x1: x - half, x2: x - half, y1: y - 6, y2: y + GRIPPER.fingerLength }),
    svgNode('line', { class: 'arm', x1: x + half, x2: x + half, y1: y - 6, y2: y + GRIPPER.fingerLength }),
  );
  $('robot-output').textContent = output;
  $('robot-stat').textContent = `Moment ${robot.step + 1} of ${ROBOT_ACTIONS.length}: ${note}`;
  $('robot-next').disabled = robot.step >= ROBOT_ACTIONS.length - 1;
}

$('robot-next').addEventListener('click', () => {
  robot.step += 1;
  renderRobot();
});
$('robot-reset').addEventListener('click', () => {
  robot.step = 0;
  renderRobot();
});

renderRobot();
